'use strict';

const Config = require('../config/config');

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            reply({ message: 'Welcome to ' + Config.getAppTitle() + '!' });
        }
    });

    next();
};


exports.register.attributes = {
    name: 'index'
};
