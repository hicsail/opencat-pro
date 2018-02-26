'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Vision = require('vision');
const Visionary = require('../');


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('register()', () => {

    it('registers a views manager', (done) => {

        const VisionaryPlugin = {
            register: Visionary,
            options: {
                engines: { 'html': require('handlebars') },
                path: __dirname
            }
        };

        const server = new Hapi.Server();
        server.connection();
        server.register([Vision, VisionaryPlugin], (err) => {

            expect(err).to.not.exist();

            const handler = (request, reply) => reply.view('test', { message: 'hi' });

            server.route({ method: 'GET', path: '/', handler });

            server.initialize(() => {

                server.inject('/', (res) => {

                    expect(res.result).to.equal('<div>\n    <h1>hi</h1>\n</div>\n');
                    done();
                });
            });
        });
    });


    it('registers a views manager (string engine)', (done) => {

        const VisionaryPlugin = {
            register: Visionary,
            options: {
                engines: { 'html': 'handlebars' },
                path: __dirname
            }
        };

        const server = new Hapi.Server();
        server.connection();
        server.register([Vision, VisionaryPlugin], (err) => {

            expect(err).to.not.exist();

            const handler = (request, reply) => reply.view('test', { message: 'hi' });

            server.route({ method: 'GET', path: '/', handler });

            server.initialize(() => {

                server.inject('/', (res) => {

                    expect(res.result).to.equal('<div>\n    <h1>hi</h1>\n</div>\n');
                    done();
                });
            });
        });
    });
});
