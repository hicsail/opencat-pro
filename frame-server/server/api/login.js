'use strict';

const Boom = require('boom');
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');
const Async = require('async');
const Bcrypt = require('bcryptjs');
const Config = require('../../config');

const internals = {};
const complexityOptions = {
  min: 10,
  max: 30,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4
};

internals.applyRoutes = function (server, next) {

  const AuthAttempt = server.plugins['hapi-mongo-models'].AuthAttempt;
  const BlockedIp = server.plugins['hapi-mongo-models'].BlockedIp;
  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;
  const StudySignup = server.plugins['hapi-mongo-models'].StudySignup;
  const Study = server.plugins['hapi-mongo-models'].Study;

  server.route({
    method: 'POST',
    path: '/login',
    config: {
      validate: {
        payload: {
          username: Joi.string().email().lowercase().required(),
          password: Joi.string().required()
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
	  },
      pre: [{
        assign: 'ipBlocked',
        method: function (request, reply) {
          const ip = request.info.remoteAddress;
          BlockedIp.checkIfBlocked(ip, (err, detected) => {

            if (err) {
              return reply(err);
            }

            if (detected) {
              return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
            }

            reply();
          });
        }
      },{
        assign: 'abuseDetected',
        method: function (request, reply) {
          const ip = request.info.remoteAddress;
          console.log("IP: " + ip);
          AuthAttempt.abuseDetected(ip, (err, detected) => {

            if (err) {
              return reply(err);
            }

            if (detected) {
              BlockedIp.create(ip);
              return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
            }

            reply();
          });
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const username = request.payload.username;
          const password = request.payload.password;

          User.findByCredentials(username, password, (err, user) => {

            if (err) {
              return reply(err);
            }

            reply(user);
          });
        }
      }, {
        assign: 'logAttempt',
        method: function (request, reply) {

          if (request.pre.user) {
            return reply();
          }

          const ip = request.info.remoteAddress;

          AuthAttempt.create(ip, (err, authAttempt) => {

            if (err) {
              return reply(err);
            }

            return reply(Boom.badRequest('Username and password combination not found or account is inactive.'));
          });
        }
      }, {
        assign: 'studySignup',
        method: function (request, reply) {

          const id = request.pre.user._id.toString();
          StudySignup.findByPatientId(id, (details, err) => {

            if (err) {
              return reply(err);
            }

            reply(details);
        });
        }
      }, {
        assign: 'study',
        method: function (request, reply) {

          const id = request.pre.studySignup ? request.pre.studySignup.studyId.toString(): '';
          Study.findByStudyId(id, (study, err) => {

            if (err) {
              return reply(err);
            }

            if(study != null && study.isActive == true) {
              const update = {
                $set: {
                  accepted: true
                }
              };

              const studyDetailsId = request.pre.studySignup._id.toString();
              StudySignup.findByIdAndUpdate(studyDetailsId, update, reply);
            }

            reply();
          });
        }
      }, {
        assign: 'session',
        method: function (request, reply) {

          Session.create(request.pre.user._id.toString(), (err, session) => {

            if (err) {
              return reply(err);
            }

            return reply(session);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const credentials = request.pre.session._id.toString() + ':' + request.pre.session.key;
      const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');
      var changePass = false;
      if (request.pre.user.lastPasswordChange) {
        const diffDays = parseInt((new Date() - request.pre.user.lastPasswordChange) / (1000 * 60));
        changePass = diffDays > Config.get('/resetPasswordLimit');
      }
      console.log("ddddd");
      console.log(request.pre.user);
      let isAccount =  request.pre.user.roles.account? true:false;

      const result = {
        user: {
          username: request.pre.user.username,
          firstName: isAccount? request.pre.user.roles.account.name : request.pre.user.roles.admin.name,
        },
        session: request.pre.session,
        authHeader: authHeader,
        changePass: changePass
      };
      request.cookieAuth.set(result);
      reply(result);
    }
  });


  server.route({
    method: 'POST',
    path: '/login/forgot',
    config: {
      validate: {
        payload: {
          username: Joi.string().email().lowercase().required()
        }
      },
      pre: [{
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            username: request.payload.username
          };
          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.badRequest('No such email found with an account'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        keyHash: function (done) {

          Session.generateKeyHash(done);
        },
        user: ['keyHash', function (results, done) {

          const id = request.pre.user._id.toString();
          const update = {
            $set: {
              resetPassword: {
                token: results.keyHash.hash,
                expires: Date.now() + 10000000
              }
            }
          };

          User.findByIdAndUpdate(id, update, done);

        }],
        email: ['user', function (results, done) {

          const emailOptions = {
            subject: 'Reset your ' + Config.get('/projectName') + ' password',
            to: request.payload.username
          };
          const template = 'forgot-password';
          const context = {
            key: results.keyHash.key
          };

          mailer.sendEmail(emailOptions, template, context, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({message: 'Success.'});
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/login/reset',
    config: {
      validate: {
        payload: {
          key: Joi.string().required(),
          username: Joi.string().email().lowercase().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            username: request.payload.username,
            'resetPassword.expires': {$gt: Date.now()}
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.badRequest('Invalid email or key.'));
            }

            reply(user);
          });
        }
      },{
        assign: 'passwordValidation',
        method: function(request, reply) {
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {
            console.error(err);
            if (err) {
              return reply(Boom.badRequest('Password does not meet complexity rules.'));
            }

            reply(true);
          });
        }
      }]
    },
    handler: function (request, reply) {
      Async.auto({
        keyMatch: function (done) {

          const key = request.payload.key;
          const token = request.pre.user.resetPassword.token;

          Bcrypt.compare(key, token, done);
        },
        passwordHash: ['keyMatch', function (results, done) {

          if (!results.keyMatch) {
            return reply(Boom.badRequest('Invalid email or key.'));
          }

          User.generatePasswordHash(request.payload.password, done);
        }],
        user: ['passwordHash', function (results, done) {

          const id = request.pre.user._id.toString();
          const update = {
            $set: {
              password: results.passwordHash.hash,
              lastPasswordChange: new Date()
            },
            $unset: {
              resetPassword: undefined
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({message: 'Success.'});
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
  name: 'login'
};
