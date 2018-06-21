'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const Config = require('../../config');


const internals = {};


internals.applyRoutes = function (server, next) {

  const User = server.plugins['hapi-mongo-models'].User;
  const StudySignup = server.plugins['hapi-mongo-models'].StudySignup;

  server.route({
    method: 'POST',
    path: '/invite',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required()
        }
      },
      auth: {
        mode: 'try',
         strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {
      const mailer = request.server.plugins.mailer;

      Async.auto({

        email: function (done) {

          const emailOptions = {
            subject: 'Your ' + Config.get('/projectName') + ' account',
            to: {
              address: request.payload.email
            }
          };

          const template = 'signup-invitation';
          const url = {url: Config.get('appUrl')};

          mailer.sendEmail(emailOptions, template, url, done);
        }
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        return reply('Email sent');
    });

    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['mailer', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'invite'
};
