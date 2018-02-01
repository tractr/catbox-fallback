'use strict';

// Load modules

const Catbox = require('catbox');
const Code = require('code');
const Lab = require('lab');
const CatboxFallback = require('..');

const CatboxMemory = require('catbox-memory');
const CatboxFake = require('./fake-engine');

// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;

const keys = {
    default: {
        id: 'test',
        segment: 'test'
    },
    no_segment: {
        id: 'test',
        segment: false
    }
};

describe('Fallback', () => {

    it('throws an error if not created with new', () => {

        const fn = () => CatboxFallback();
        expect(fn).to.throw(Error);
    });

    it('throws an error if no options', (done) => {

        let client;
        try {
            client = new Catbox.Client(CatboxFallback, false);
        }
        catch (err) {
            expect(err.message).to.equal('Must set a primary');
        }

        expect(client).to.equal(undefined);
    });

    it('throws an error if no primary when creating a new connection', (done) => {

        let client;
        try {
            client = new Catbox.Client(CatboxFallback, { secondary: { engine: CatboxMemory } });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a primary');
        }

        expect(client).to.equal(undefined);
    });

    it('throws an error if no secondary when creating a new connection', (done) => {

        let client;
        try {
            client = new Catbox.Client(CatboxFallback, { primary: { engine: CatboxMemory } });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a secondary');
        }

        expect(client).to.equal(undefined);
    });

    it('throws an error if no primary engine when creating a new connection', (done) => {

        let client;
        try {
            client = new Catbox.Client(CatboxFallback, {
                primary: {},
                secondary: { engine: CatboxMemory }
            });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a primary engine');
        }

        expect(client).to.equal(undefined);
    });

    it('throws an error if no secondary engine when creating a new connection', (done) => {

        let client;
        try {
            client = new Catbox.Client(CatboxFallback, {
                primary: { engine: CatboxMemory },
                secondary: {}
            });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a secondary engine');
        }

        expect(client).to.equal(undefined);
    });

    it('should start if it has two engines', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory
            },
            secondary: {
                engine: CatboxMemory
            }
        });

        await client.start();

        expect(client.isReady()).to.equal(true);
    });

    it('should stop if it\'s asked to', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory
            },
            secondary: {
                engine: CatboxMemory
            }
        });

        await client.start();

        expect(client.isReady()).to.equal(true);

        await client.stop();

        expect(client.isReady()).to.equal(false);
    });

    it('should restart if it\'s asked to', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory
            },
            secondary: {
                engine: CatboxMemory
            }
        });

        await client.start();

        expect(client.isReady()).to.equal(true);

        await client.stop();

        expect(client.isReady()).to.equal(false);

        await client.start();

        expect(client.isReady()).to.equal(true);
    });

    it('should set and get on primary', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item.item).to.equal(value);
        expect(item.origin).to.equal('primary');
    });

    it('should drop on primary', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item.item).to.equal(value);
        expect(item.origin).to.equal('primary');

        await client.drop(key);

        const got = await client.get(key);

        expect(got).to.equal(null);
    });

    it('should set and get on secondary', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item.item).to.equal(value);
        expect(item.origin).to.equal('secondary');
    });

    it('should drop on secondary', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item.item).to.equal(value);
        expect(item.origin).to.equal('secondary');

        await client.drop(key);

        const got = await client.get(key);

        expect(got).to.equal(null);
    });

    it('should be ready if both engines are up', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysReady: true }
            },
            debug: true,
            alwaysReady: false
        });

        await client.start();

        const ready = client.isReady();

        expect(ready).to.equal(true);
    });

    it('should be ready if primary engine is down', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysReady: true }
            },
            debug: true,
            alwaysReady: false
        });

        await client.start();

        const ready = client.isReady();

        expect(ready).to.equal(true);
    });

    it('should be ready if secondary engine is down', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            },
            debug: true,
            alwaysReady: false
        });

        await client.start();

        const ready = client.isReady();

        expect(ready).to.equal(true);
    });

    it('set should fail if both engines are down', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            },
            debug: true,
            alwaysReady: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        try {
            await client.set(key, value, _ttl);
        }
        catch (err) {
            expect(err.message).to.equal('Disconnected');
        }
    });

    it('get should fail if both engines are down', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            },
            debug: true,
            alwaysReady: true
        });

        const key = keys.default;

        await client.start();

        try {
            await client.get(key);
        }
        catch (err) {
            expect(err.message).to.equal('Disconnected');
        }
    });

    it('drop should fail if both engines are down', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            },
            debug: true,
            alwaysReady: true
        });

        const key = keys.default;

        await client.start();

        try {
            await client.drop(key);
        }
        catch (err) {
            expect(err.message).to.equal('Disconnected');
        }
    });

    it('should not be ready if both engines are down', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            }, secondary: {
                engine: CatboxFake,
                options: { alwaysNotReady: true }
            },
            debug: true,
            alwaysReady: false
        });

        await client.start();

        const ready = client.isReady();

        expect(ready).to.equal(false);
    });

    it('should send debug data if requested', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory,
                options: {}
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item } = await client.get(key);

        expect(item.origin).to.equal('primary');
    });

    it('should not send debug data not requested', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxMemory
            }, secondary: {
                engine: CatboxMemory
            }
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item } = await client.get(key);

        expect(item).to.equal(value);
    });
});

describe('Fake', () => {

    it('should start', async (done) => {

        const client = new Catbox.Client(CatboxFake);

        await client.start();

        expect(client.isReady()).to.equal(true);
    });

    it('should stop', async (done) => {

        const client = new Catbox.Client(CatboxFake);

        await client.start();

        expect(client.isReady()).to.equal(true);

        await client.stop();

        expect(client.isReady()).to.equal(false);
    });

    it('should restart', async (done) => {

        const client = new Catbox.Client(CatboxFake);

        await client.start();

        expect(client.isReady()).to.equal(true);

        await client.stop();

        expect(client.isReady()).to.equal(false);

        await client.start();

        expect(client.isReady()).to.equal(true);
    });

    it('should not be ready if alwaysNotReady is true', async (done) => {

        const client = new Catbox.Client(CatboxFake, { alwaysNotReady: true });

        await client.start();

        expect(client.isReady()).to.equal(false);
    });

    it('should be ready if alwaysReady is true', async (done) => {

        const client = new Catbox.Client(CatboxFake, { alwaysReady: true });

        await client.start();
        await client.stop();

        expect(client.isReady()).to.equal(true);
    });

    it('should fail if alwaysReady and alwaysNotReady are true', (done) => {

        let client;
        try {
            client = new Catbox.Client(CatboxFake, { alwaysReady: true, alwaysNotReady: true });
        }
        catch (err) {
            expect(err.message).to.equal('Must set either alwaysReady or alwaysNotReady, not both');
        }

        expect(client).to.equal(undefined);
    });
});
