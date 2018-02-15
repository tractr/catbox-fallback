'use strict';

// Load modules

const Catbox = require('catbox');
const Code = require('code');
const Lab = require('lab');
const CatboxFallback = require('../lib');

const CatboxMemory = require('catbox-memory');
const CatboxFake = require('catbox-fake');

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
    },
    who: {
        id: 'who',
        segment: 'test'
    }
};

const sleep = (delay) => {

    return new Promise((r) => {

        setTimeout(r, delay);
    });
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

    it('should stop if primary engine is down', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxFake
            },
            debug: true
        });

        primary.throw(true);

        await client.start();
        await client.stop();

        const ready = client.isReady();

        expect(ready).to.equal(false);
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

    it('should set and get', async (done) => {

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

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item).to.equal(value);
    });

    it('should set and get if primary down', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxMemory
            }
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        primary.throw(true);

        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item).to.equal(value);
    });

    it('should drop', async (done) => {

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

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item).to.equal(value);

        await client.drop(key);

        const got = await client.get(key);

        expect(got).to.equal(null);
    });

    it('should drop if primary down', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxMemory
            }
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        primary.throw(true);

        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item).to.equal(value);

        await client.drop(key);

        const got = await client.get(key);

        expect(got).to.equal(null);
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
        expect(item).to.equal(`primary-${value}`);
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
        expect(item).to.equal(`primary-${value}`);

        await client.drop(key);

        const got = await client.get(key);

        expect(got).to.equal(null);
    });

    it('should set and get on secondary', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        primary.throw(true);

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item).to.equal(`secondary-${value}`);
    });

    it('should drop on secondary', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        primary.throw(true);

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();
        await client.set(key, value, _ttl);

        const { item, ttl } = await client.get(key);

        expect(ttl).to.most(_ttl);
        expect(item).to.equal(`secondary-${value}`);

        await client.drop(key);

        const got = await client.get(key);

        expect(got).to.equal(null);
    });

    it('should be ready if both engines are up', async (done) => {

        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake
            }, secondary: {
                engine: CatboxFake
            },
            debug: true
        });

        await client.start();

        const ready = client.isReady();

        expect(ready).to.equal(true);
    });

    it('should be ready if primary engine is down', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxFake
            },
            debug: true
        });

        primary.throw(true);

        await client.start();

        const ready = client.isReady();

        expect(ready).to.equal(true);
    });

    it('should not be ready if secondary engine is down', async (done) => {

        let secondary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake
            }, secondary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        secondary = m;
                    }
                }
            },
            debug: true
        });

        await client.start();

        secondary.ready(false);

        const ready = client.isReady();

        expect(ready).to.equal(false);
    });

    it('set should fail if both engines are down', async (done) => {

        let primary = {};
        let secondary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        secondary = m;
                    }
                }
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        primary.throw(true);
        secondary.throw(true);

        try {
            await client.set(key, value, _ttl);
        }
        catch (err) {
            expect(err.message).to.be.a.string();
        }
    });

    it('get should fail if both engines are down', async (done) => {

        let primary = {};
        let secondary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        secondary = m;
                    }
                }
            },
            debug: true
        });

        const key = keys.default;

        await client.start();

        primary.throw(true);
        secondary.throw(true);

        try {
            await client.get(key);
        }
        catch (err) {
            expect(err.message).to.be.a.string();
        }
    });

    it('drop should fail if both engines are down', async (done) => {

        let primary = {};
        let secondary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        secondary = m;
                    }
                }
            },
            debug: true
        });

        const key = keys.default;

        primary.throw(true);
        secondary.throw(true);

        try {
            await client.drop(key);
        }
        catch (err) {
            expect(err.message).to.be.a.string();
        }
    });

    it('should not be ready if both engines are down', async (done) => {

        let primary = {};
        let secondary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        secondary = m;
                    }
                }
            },
            debug: true
        });

        await client.start();

        primary.ready(false);
        secondary.ready(false);

        const ready = client.isReady();

        expect(ready).to.equal(false);
    });

    it('should send debug data if requested', async (done) => {

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

        const { item } = await client.get(key);

        expect(item).to.equal(`primary-${value}`);
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

    it('get and set should switch on secondary if primary is down', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        // Set and get on primary
        await client.set(key, value, _ttl);

        let item = (await client.get(key)).item;
        expect(item).to.equal(`primary-${value}`);

        // Break primary
        primary.throw(true);

        // Get on secondary
        item = (await client.get(key));
        expect(item).to.equal(null);

        // Set and get on secondary
        await client.set(key, value, _ttl);

        item = (await client.get(key)).item;
        expect(item).to.equal(`secondary-${value}`);
    });

    it('should not recover if primary comes back and no recovery policy is defined', async (done) => {

        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                }
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        // Set on primary
        await client.set(key, value, _ttl);

        // Break primary
        primary.throw(true);

        // Set on secondary
        await client.set(key, value, _ttl);

        // Recover primary
        primary.throw(false);

        const { item } = (await client.get(key));
        expect(item).to.equal(`secondary-${value}`);

    });

    it('should recover if primary comes back and a recovery policy is defined', async (done) => {

        const recoveryDelay = 100;
        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                },
                recoveryDelay
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        // Set on primary
        await client.set(key, value, _ttl);

        // Break primary
        primary.throw(true);

        // Set and get on secondary
        await client.set(key, value, _ttl);
        let item = (await client.get(key)).item;
        expect(item).to.equal(`secondary-${value}`);

        // Recover primary
        primary.throw(false);

        // Try once and should still get secondary
        expect(item).to.equal(`secondary-${value}`);

        // Wait a while
        await sleep(recoveryDelay);

        item = (await client.get(key)).item;
        expect(item).to.equal(`primary-${value}`);

    });

    it('should use secondary if primary timeouts and a timeout policy is defined', async (done) => {

        const timeout = 100;
        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                },
                timeout
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        // Break primary
        primary.delay(timeout + 10);

        // Set on secondary
        await client.set(key, value, _ttl);

        // Get on secondary
        const item = (await client.get(key)).item;
        expect(item).to.equal(`secondary-${value}`);

    });

    it('should recover if primary timeouts and timeout and recover policies are defined', async (done) => {

        const recoveryDelay = 100;
        const timeout = 100;
        let primary = {};
        const client = new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxFake,
                options: {
                    trojan: (m) => {

                        primary = m;
                    }
                },
                timeout,
                recoveryDelay
            }, secondary: {
                engine: CatboxMemory
            },
            debug: true
        });

        const key = keys.default;
        const value = 'value';
        const _ttl = 9999;

        await client.start();

        // Break primary
        primary.delay(timeout + 10);

        // Set on secondary
        await client.set(key, value, _ttl);

        // Recover primary
        primary.delay(0);

        // Get on secondary
        let item = (await client.get(key)).item;
        expect(item).to.equal(`secondary-${value}`);

        // Wait a while
        await sleep(recoveryDelay);

        // Get on primary
        item = (await client.get(key)).item;
        expect(item).to.equal(`primary-${value}`);

    });
});
