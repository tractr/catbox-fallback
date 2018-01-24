'use strict';

// Load modules

const BigTime = require('big-time');
const Boom = require('boom');
const Hoek = require('hoek');
const Catbox = require('catbox');


// Declare internals

const internals = {
    defaults: {}
};

exports = module.exports = internals.Connection = class {

    constructor(options) {

        Hoek.assert(this.constructor === internals.Connection, 'Cache client must be instantiated using new');
        Hoek.assert(!options || typeof options.primary   === 'object', 'Must set a primary');
        Hoek.assert(!options || typeof options.secondary === 'object', 'Must set a secondary');
        Hoek.assert(!options || typeof options.primary.engine   === 'function', 'Must set a primary engine');
        Hoek.assert(!options || typeof options.secondary.engine === 'function', 'Must set a secondary engine');
        
        this.settings = Hoek.applyToDefaults(internals.defaults, options || {});

        this.primary = null;
        this.secondary = null;
    }

    async start() {

        this.primary   = new Catbox.Client(this.settings.primary.engine,   this.settings.primary.options || {});
        this.secondary = new Catbox.Client(this.settings.secondary.engine, this.settings.secondary.options || {});

        await this.primary.start();
        //await this.secondary.start();
    }

    async stop() {

        if (!this.isReady()) {
            throw new Boom('Connection not started');
        }

        this.primary.stop();
        this.secondary.stop();
    }

    isReady() {

        return !!this.primary.isReady() && !!this.secondary.isReady();
    }

    validateSegmentName(name) {

        if (!name) {
            throw new Boom('Empty string');
        }

        if (name.indexOf('\u0000') !== -1) {
            throw new Boom('Includes null character');
        }

        return null;
    }

    async get(key) {


        return this.primary.get(key);

        return;

        if (!this.isReady()) {
            throw new Boom('Connection not started');
        }

        const segment = this.cache.get(key.segment);
        if (!segment) {
            return null;
        }

        const envelope = segment.get(key.id);

        if (!envelope) {
            return null;
        }

        let item = null;
        if (Buffer.isBuffer(envelope.item)) {
            item = envelope.item;
        }
        else {
            try {
                item = JSON.parse(envelope.item);
            }
            catch (err) {
                throw new Boom('Bad value content');
            }
        }

        const result = {
            item,
            stored: envelope.stored,
            ttl: envelope.ttl
        };

        return result;
    }

    async set(key, value, ttl) {

        if (!this.isReady()) {
            throw new Boom('Connection not started');
        }

        console.log('key');
        console.log(key);
        console.log('key');

        return this.primary.set(key, value, ttl);

        return;

        if (!this.cache) {
            throw new Boom('Connection not started');
        }

        const envelope = new internals.MemoryCacheEntry(key, value, ttl, this.settings.allowMixedContent);

        let segment = this.cache.get(key.segment);
        if (!segment) {
            segment = new Map();
            this.cache.set(key.segment, segment);
        }

        const cachedItem = segment.get(key.id);
        if (cachedItem &&
            cachedItem.timeoutId) {

            BigTime.clearTimeout(cachedItem.timeoutId);
            this.byteSize -= cachedItem.byteSize;                   // If the item existed, decrement the byteSize as the value could be different
        }

        if (this.settings.maxByteSize &&
            (this.byteSize + envelope.byteSize > this.settings.maxByteSize)) {

            throw new Boom('Cache size limit reached');
        }

        envelope.timeoutId = BigTime.setTimeout(() => this.drop(key), ttl);

        segment.set(key.id, envelope);
        this.byteSize += envelope.byteSize;
    }

    drop(key) {

        if (!this.isReady()) {
            throw new Boom('Connection not started');
        }

        return this.primary.delete(key);

        const segment = this.cache.get(key.segment);
        if (segment) {
            const item = segment.get(key.id);
            if (item) {
                BigTime.clearTimeout(item.timeoutId);
                this.byteSize -= item.byteSize;
            }

            segment.delete(key.id);
        }
    }
};
