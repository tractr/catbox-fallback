'use strict';

// Load modules

const Hoek = require('hoek');
const Catbox = require('catbox');

// Declare internals

const internals = {};

internals.defaults = {};

const addDebug = (origin, result) => {

    if (result === null) {
        return null;
    }

    const _result = {
        item: {
            item: result.item,
            origin
        },
        ttl: result.ttl,
        stored: result.stored
    };

    return _result;
};
const addNoDebug = (origin, item) => item;

exports = module.exports = internals.Connection = function (options) {

    Hoek.assert(this.constructor === internals.Connection, 'Fallback client must be instantiated using new');
    Hoek.assert(typeof options.primary === 'object', 'Must set a primary');
    Hoek.assert(typeof options.secondary === 'object', 'Must set a secondary');
    Hoek.assert(typeof options.primary.engine === 'function', 'Must set a primary engine');
    Hoek.assert(typeof options.secondary.engine === 'function', 'Must set a secondary engine');

    this.settings = Hoek.applyToDefaults(internals.defaults, options);

    this.primary = new Catbox.Client(this.settings.primary.engine, this.settings.primary.options || {});
    this.secondary = new Catbox.Client(this.settings.secondary.engine, this.settings.secondary.options || {});

    this.debug = this.settings.debug ? addDebug : addNoDebug;
    this.alwaysReady = this.settings.alwaysReady || false;

    return this;
};

// Async
internals.Connection.prototype.start = async function () {

    await Promise.all([this.primary.start(), this.secondary.start()]);
};

internals.Connection.prototype.stop = async function () {

    await Promise.all([this.primary.stop(), this.secondary.stop()]);
};


internals.Connection.prototype.isReady = function () {

    return this.alwaysReady ? true : (this.primary.isReady() || this.secondary.isReady());
};

internals.Connection.prototype.validateSegmentName = function (name) {
    /* $lab:coverage:off$ */
    return null;
    /* $lab:coverage:on$ */
};

internals.Connection.prototype.get = async function (key) {

    if (this.primary.isReady()) {
        const result = await this.primary.get(key);

        return this.debug('primary', result);
    }
    else if (this.secondary.isReady()) {
        const result = await this.secondary.get(key);

        return this.debug('secondary', result);
    }

    throw new Error('Disconnected');
};

internals.Connection.prototype.set = async function (key, value, ttl) {

    if (this.primary.isReady()) {
        await this.primary.set(key, value, ttl);

        return;
    }
    else if (this.secondary.isReady()) {
        await this.secondary.set(key, value, ttl);

        return;
    }

    throw new Error('Disconnected');
};

internals.Connection.prototype.drop = async function (key) {

    if (this.primary.isReady()) {
        await this.primary.drop(key);

        return;
    }
    else if (this.secondary.isReady()) {
        await this.secondary.drop(key);

        return;
    }

    throw new Error('Disconnected');
};
