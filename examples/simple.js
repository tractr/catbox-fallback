'use strict';

const Hapi = require('hapi');
const CatboxFallback = require('../lib');
const CatboxRedis = require('catbox-redis');
const CatboxMemory = require('catbox-memory');

const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    cache: {
        name: 'fallback',
        provider: {
            constructor: CatboxFallback,
            options: {
                primary: {
                    engine: CatboxRedis,
                    options: {
                        partition: 'example',
                        host: '127.0.0.1',
                        port: 6379,
                    }
                },
                secondary: {
                    engine: CatboxMemory,
                }
            }
        }
    }
});

const init = async () => {

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);

    // For testing purpose
    // "Ping" cache engine
    const cacheClient = server.cache({
        cache: 'fallback',
        shared: true,
        expiresIn: 10,
        segment: 'testing'
    });
    await cacheClient.set('test', { foo: 'bar' });
    console.log('Cache test result: ', await cacheClient.get('test'));
};

process.on('unhandledRejection', (err) => {

    console.error(err);
    process.exit(1);
});

init();
