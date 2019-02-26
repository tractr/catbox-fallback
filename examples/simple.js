'use strict';

const Hapi = require('hapi');
const Catbox = require('catbox');
const CatboxFallback = require('catbox-fallback');
const CatboxRedis = require('catbox-redis');
const CatboxMemory = require('catbox-memory');

const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    cache:  new Catbox.Client(CatboxFallback, {
            primary: {
                engine: CatboxRedis({
                    partition: 'examples',
                    host: '127.0.0.1',
                    port: '6379',
                    password: ''
                })
            },
            secondary: {
                engine: CatboxMemory()
            }
    })
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
