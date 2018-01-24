'use strict';

// Load modules

const BigTime = require('big-time');
const Boom = require('boom');
const Hoek = require('hoek');
const Catbox = require('catbox');


// Declare internals

const internals = {};

internals.defaults = {};

exports = module.exports = internals.Connection = function (options) {


    Hoek.assert(this.constructor === internals.Connection, 'Fallback client must be instantiated using new');
    Hoek.assert(!options || typeof options.primary   === 'object', 'Must set a primary');
    Hoek.assert(!options || typeof options.secondary === 'object', 'Must set a secondary');
    Hoek.assert(!options || typeof options.primary.engine   === 'function', 'Must set a primary engine');
    Hoek.assert(!options || typeof options.secondary.engine === 'function', 'Must set a secondary engine');
    
    this.settings = Hoek.applyToDefaults(internals.defaults, options || {});

    this.primary = null;
    this.secondary = null;

    return this;
};


// Async
internals.Connection.prototype.start = async function () {

    this.primary   = new Catbox.Client(this.settings.primary.engine,   this.settings.primary.options || {});
    this.secondary = new Catbox.Client(this.settings.secondary.engine, this.settings.secondary.options || {});

    await this.primary.start();
    await this.secondary.start();
};


internals.Connection.prototype.stop = async function () {

    await this.primary.stop();
    await this.secondary.stop();
};


internals.Connection.prototype.isReady = async function () {

    return await this.primary.isReady() && await this.secondary.isReady();
};


internals.Connection.prototype.validateSegmentName = function (name) {

    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\0') !== -1) {
        return new Error('Includes null character');
    }

    return null;
};

internals.Connection.prototype.get = async function (key) {

    return await this.primary.get(key);
};

internals.Connection.prototype.set = async function (key, value, ttl) {

    await this.primary.set(key, value, ttl);
};

internals.Connection.prototype.drop = async function (key) {

    return await this.primary.del(key);
};
