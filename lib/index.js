'use strict';

// Load modules

const Hoek = require('hoek');
const Catbox = require('catbox');

// Custom errors
class TimeoutError extends Error {
    constructor(timeout, ...params) {
        // Call super constructor
        super(...params);
        // Add custom vars
        this.timeout = timeout;
    }
}

// Declare internals

const internals = {};

internals.defaults = {};

exports = module.exports = internals.Connection = function (options) {

    Hoek.assert(this.constructor === internals.Connection, 'Fallback client must be instantiated using new');
    Hoek.assert(typeof options.primary === 'object', 'Must set a primary');
    Hoek.assert(typeof options.secondary === 'object', 'Must set a secondary');
    Hoek.assert(typeof options.primary.engine === 'function', 'Must set a primary engine');
    Hoek.assert(typeof options.secondary.engine === 'function', 'Must set a secondary engine');

    this.settings = Hoek.applyToDefaults(internals.defaults, options);

    this.primary = new Catbox.Client(this.settings.primary.engine, this.settings.primary.options || {});
    this.secondary = new Catbox.Client(this.settings.secondary.engine, this.settings.secondary.options || {});

    this.debug = this.settings.debug || false;

    this.primaryTimeout = this.settings.primary.timeout || false;
    this.primaryRecoveryDelay = this.settings.primary.recoveryDelay || false;
    this.primaryHealthy = true;

    // In debug mode, override the setter
    if (this.debug) {
        this.set = this._debugSet;
    }

    return this;
};

// Async
internals.Connection.prototype.start = async function () {

    // Primary health is optional
    const primary = this._run(() => this.primary.start(), () => Promise.resolve());
    const secondary = this.secondary.start();
    await Promise.all([primary, secondary]);
};

internals.Connection.prototype.stop = async function () {

    // Primary health is optional
    const primary = this._run(() => this.primary.stop(), () => Promise.resolve());
    const secondary = this.secondary.stop();
    await Promise.all([primary, secondary]);
};


internals.Connection.prototype.isReady = function () {

    // Only secondary muse be ready, primary can be dead
    return this.secondary.isReady();
};

internals.Connection.prototype.validateSegmentName = function (name) {
    /* $lab:coverage:off$ */
    return null;
    /* $lab:coverage:on$ */
};

internals.Connection.prototype.get = async function (key) {

    return await this._run(
        () => this.primary.get(key),
        () => this.secondary.get(key)
    );
};

internals.Connection.prototype.set = async function (key, value, ttl) {

    await this._run(
        () => this.primary.set(key, value, ttl),
        () => this.secondary.set(key, value, ttl)
    );
};

internals.Connection.prototype._debugSet = async function (key, value, ttl) {

    await this._run(
        () => this.primary.set(key, `primary-${value}`, ttl),
        () => this.secondary.set(key, `secondary-${value}`, ttl)
    );
};

internals.Connection.prototype.drop = async function (key) {

    await this._run(
        () => this.primary.drop(key),
        () => this.secondary.drop(key)
    );
};

/**
 * Run a primary method and deal with potential timeout and errors
 *
 * @param {Function<Promise>} method
 *  The primary method to execute
 * @param {Function<Promise>} fallback
 *  The fallback methode to run if the first one fails
 * @returns {Promise.<void>}
 * @private
 */
internals.Connection.prototype._run = function (method, fallback) {

    // If the primary is not healthy, use directly the fallback
    if (!this.primaryHealthy) {
        return fallback();
    }

    // Try on primary
    return new Promise((resolve, reject) => {

        let timeout = null;
        let timeoutReached = false;
        // Set timeout only if defined
        if (this.primaryTimeout) {
            timeout = setTimeout(() => {

                timeoutReached = true;
                reject(new TimeoutError(this.primaryTimeout, 'Timeout on primary engine'));
            }, this.primaryTimeout);
        }
        // Runs the method safely
        method()
            .then((result) => {
                // Bypass resolver if the error has been thrown
                if (!timeoutReached) {
                    clearTimeout(timeout);
                    resolve(result);
                }
            })
            .catch(reject);
    })
        .catch(() => {
            /** @todo deal with error in debug mode */
            // If an error occurred, flag the primary as unhealthy
            this.primaryHealthy = false;
            // If a recovery delay is set, add a timeout to reconnect the primary
            if (this.primaryRecoveryDelay) {
                setTimeout(() => {

                    this.primaryHealthy = true;
                }, this.primaryRecoveryDelay);
            }

            return fallback();
        });
};
