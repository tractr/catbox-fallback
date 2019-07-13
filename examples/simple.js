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
        engine: CatboxFallback,
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
});

const init = async () => {

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
