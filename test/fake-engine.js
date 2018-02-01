'use strict';

// Load modules

const Hoek = require('hoek');

// Declare internals

const internals = {};

internals.defaults = {};

exports = module.exports = internals.Connection = function (options) {

    Hoek.assert(this.constructor === internals.Connection, 'Fake Engine client must be instantiated using new');
    Hoek.assert(!(options.alwaysNotReady && options.alwaysReady), 'Must set either alwaysReady or alwaysNotReady, not both');

    this.settings = Hoek.applyToDefaults(internals.defaults, options);

    this.alwaysNotReady = this.settings.alwaysNotReady || false;
    this.alwaysReady = this.settings.alwaysReady || false;

    this.ready = false;

    return this;
};

internals.Connection.prototype.start = function () {

    this.ready = true;
};


internals.Connection.prototype.stop = function () {

    this.ready = false;
};


internals.Connection.prototype.isReady = function () {

    return this.alwaysNotReady ? false : this.alwaysReady ? true : this.ready;
};

internals.Connection.prototype.validateSegmentName = function (name) {

    return null;
};

internals.Connection.prototype.get = function (key) {

    return { item: 'fake-engine', ttl: 9999, stored: (new Date().getTime() - 100) };
};

internals.Connection.prototype.set = function (key, value, ttl) {

};

internals.Connection.prototype.drop = function (key) {

};
