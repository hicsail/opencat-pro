'use strict';

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            reply({ message: 'Welcome to sci-fi!' });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'index'
};
