'use strict';

// Load modules

const Catbox = require('catbox');
const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Fallback = require('..');

const CatboxMemory = require('catbox-memory');
const CatboxRedis = require('catbox-redis');

// Declare internals

const internals = {};


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Fallback', () => {
/*
    it('throws an error if not created with new', () => {

        const fn = () => Fallback();
        expect(fn).to.throw(Error);
    });

    it('throws an error if no primary when creating a new connection', async (done) => {

        try {
            const client = new Catbox.Client(Fallback, { secondary: { engine: CatboxMemory } });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a primary');
        }
    });

    it('throws an error if no secondary when creating a new connection', async (done) => {

        try {
            const client = new Catbox.Client(Fallback, { primary: { engine: CatboxRedis } });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a secondary');
        }
    });

    it('throws an error if no primary engine when creating a new connection', async (done) => {

        try {
            const client = new Catbox.Client(Fallback, {
                primary: {},
                secondary: { engine: CatboxMemory },
            });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a primary engine');
        }
    });

    it('throws an error if no secondary engine when creating a new connection', async (done) => {

        try {
            const client = new Catbox.Client(Fallback, {
                primary: { engine: CatboxRedis },
                secondary: {}
            });
        }
        catch (err) {
            expect(err.message).to.equal('Must set a secondary engine');
        }
    });

    it('should start if it has two engines', async (done) => {

        const client = new Catbox.Client(Fallback, {
            primary: {
                engine: CatboxRedis
            }, secondary: {
                engine: CatboxMemory
            }
        });

        await client.start();
        expect(client.isReady()).to.equal(true);
    });*/

    it('should set on primary', async (done) => {

        const client = new Catbox.Client(Fallback, {
            primary: {
                engine: CatboxRedis
            }, secondary: {
                engine: CatboxMemory
            }
        });

        const key = {
            id: 'test',
            segment: 'test'
        }

        await client.start();
        await client.set(key, 'ok', 9999);
        console.log(await client.get(key));
    })
});
