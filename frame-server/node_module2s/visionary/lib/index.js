'use strict';

const Hoek = require('hoek');


const internals = {
    after: function (options, server, next) {

        Hoek.assert(options, 'Visionary missing configuration');
        Hoek.assert(options.engines, 'Visionary configuration missing engines');

        const settings = Hoek.cloneWithShallow(options, 'engines');
        settings.engines = {};

        // Process configuration

        const engines = Object.keys(options.engines);
        engines.forEach((engine) => {

            const value = options.engines[engine];
            settings.engines[engine] = typeof value === 'string' ? require(value) : value;
        });

        // Setup manager

        server.root.views(settings);
        return next();
    }
};


exports.register = function (server, options, next) {

    server.dependency('vision', internals.after.bind(null, options));

    return next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};
