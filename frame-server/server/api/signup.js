'use strict';

const Boom = require('boom');
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');
const Async = require('async');
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

  const Account = server.plugins['hapi-mongo-models'].Account;
  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;
  const Admin = server.plugins['hapi-mongo-models'].Admin;
  const StudySignup = server.plugins['hapi-mongo-models'].StudySignup;
  const Study = server.plugins['hapi-mongo-models'].Study;


  server.route({
    method: 'POST',
    path: '/signup/clinician',
    config: {
      validate: {
        payload: {
          username: Joi.string().email().lowercase().required(),
          password: Joi.string().min(10).required(),
          firstName: Joi.string().lowercase().required(),
          middleName: Joi.string().lowercase().allow('').optional(),
          lastName: Joi.string().lowercase().required(),
          yearOfInjury: Joi.number().integer().min(1000).max(3000).required(),
          gender: Joi.string().valid('male', 'female').required(),
          siteNum: Joi.number().integer().required(),
          comments: Joi.string().allow('').optional(),
          tncAgreement: Joi.boolean().required(),
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
        assign: 'usernameCheck',
        method: function (request, reply) {

          const conditions = {
            username: request.payload.username
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (user) {
              return reply(Boom.conflict(request.l10n.gettext("Username already in use.")));
            }

            reply(true);
          });
        }
      },  {
        assign: 'passwordValidation',
        method: function (request, reply) {
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {
            console.error(err);
            if (err) {
              return reply(Boom.badRequest(request.l10n.gettext("Password does not meet complexity rules.")));
            }

            reply(true);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        user: function (done) {

          const username = request.payload.username;
          const password = request.payload.password;
          const gender = request.payload.gender;


          User.create(username, password, gender, done);
        },
        admin: ['user', function (results, done) {
          const name = {
            first: request.payload.firstName ,
            middle: request.payload.middleName,
            last: request.payload.lastName
          };

          Admin.create(name, done);
        }],
        adminMembership: ['admin', function (results, done) {

          const id = results.admin._id.toString();
          const update = {
            $set: {
              groups: {
                clinician: 'Clinician'
              }
            }
          };

          Admin.findByIdAndUpdate(id, update, done);
        }],
        linkUser: ['admin', 'user', function (results, done) {

          const id = results.user._id.toString();
          const update = {
            $set: {
              'roles.admin': {
                id: results.admin._id.toString(),
                name: results.admin.name.first,
                groups: {
                  clinician: 'Clinician'
                }

              }
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }],
        linkAdmin: ['admin', 'user', function (results, done) {

          const id = results.admin._id.toString();
          const update = {
            $set: {
              user: {
                id: results.user._id.toString(),
                name: results.user.username
              }
            }
          };

          Admin.findByIdAndUpdate(id, update, done);
        }],
        welcome: ['linkUser', 'linkAdmin', function (results, done) {

          const emailOptions = {
            subject: 'Your ' + Config.get('/projectName') + ' account',
            to: {
              name: request.payload.firstName + ' ' + request.payload.lastName,
              address: request.payload.username
            }
          };
          const template = 'welcome';

          mailer.sendEmail(emailOptions, template, request.payload, (err) => {

            if (err) {
              console.warn('sending welcome email failed:', err.stack);
            }
          });

          done();
        }],
        session: ['linkUser', 'linkAdmin', function (results, done) {

          Session.create(results.user._id.toString(), done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        const user = results.linkAdmin;
        const credentials = results.session._id + ':' + results.session.key;
        const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

        const result = {
          user: {
            username: user.username,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
          },
          session: results.session,
          authHeader: authHeader
        };

        request.cookieAuth.set(result);
        reply(result);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/signup/patient',
    config: {
      validate: {
        payload: {
          username: Joi.string().email().lowercase().required(),
          password: Joi.string().min(10).required(),
          firstName: Joi.string().lowercase().required(),
          middleName: Joi.string().lowercase().allow('').optional(),
          lastName: Joi.string().lowercase().required(),
          yearOfInjury: Joi.number().integer().min(1000).max(3000).required(),
          gender: Joi.string().valid('male', 'female').required(),
          siteNum: Joi.number().integer().required(),
          comments: Joi.string().allow('').optional(),
          tncAgreement: Joi.boolean().required()
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
        assign: 'usernameCheck',
        method: function (request, reply) {

          const conditions = {
            username: request.payload.username
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (user) {
              return reply(Boom.conflict(request.l10n.gettext("Username already in use.")));
            }

            reply(true);
          });
        }
      },  {
        assign: 'passwordValidation',
        method: function (request, reply) {
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {
            console.error(err);
            if (err) {
              return reply(Boom.badRequest(request.l10n.gettext("Password does not meet complexity rules.")));
            }

            reply(true);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        user: function (done) {

          const username = request.payload.username;
          const password = request.payload.password;
          const gender = request.payload.gender;

          User.create(username, password,gender ,done);
        },
        studyDetails: ['user', function(results, done) {

          const id = results.user._id.toString();

          StudySignup.findByPatientId(id, done);
        }],
        study: ['studyDetails', function(results, done) {

          if(request.studyDetails != null) {
            const id = request.studyDetails.studyId.toString();
            Study.findByStudyId(id, (study, err) => {
              // if a study found and is active, change accepted = true
              if(study != null && study.isActive == true) {

                const update = {
                  $set: {
                    accepted: true
                  }
                };

                const studyDetailsId = request.pre.studySignup._id.toString();
                StudySignup.findByIdAndUpdate(studyDetailsId, update, done);
              } else {
                console.log('study is null!');
              }
            });
          } else {
            console.log('found no study signup details for the given user id');
          }
          done();
        }],
        account: ['user', function (results, done) {
          const name = {
              first: request.payload.firstName ,
              middle: request.payload.middleName,
              last: request.payload.lastName
          };
          const yearOfInjury = request.payload.yearOfInjury;
          const sitenum = request.payload.siteNum;
          const comments = request.payload.comments;
          const tncAgreement = request.payload.tncAgreement;
          const lastPasswordChange= new Date();

          Account.create(name, yearOfInjury, sitenum, comments, tncAgreement,lastPasswordChange, done);
        }],
        linkUser: ['account', function (results, done) {
          console.log("Done in account is");
          console.log(done);
          console.log("Results.account in account is");
          console.log(results.account);

          const id = results.account._id.toString();
          const update = {
            $set: {
              user: {
                id: results.user._id.toString(),
                name: results.user.username
              }
            }
          };

          Account.findByIdAndUpdate(id, update, done);
        }],
        linkAccount: ['account', function (results, done) {
          const id = results.user._id.toString();
          var update = {
            $set: {
              roles: {
                account: {
                  id: results.account._id.toString(),
                  name: results.account.name.first
                }
              }
            }
          };
          User.findByIdAndUpdate(id, update, done);
        }],
        welcome: ['linkUser', 'linkAccount', function (results, done) {

          const emailOptions = {
            subject: 'Your ' + Config.get('/projectName') + ' account',
            to: {
              name: request.payload.firstName + ' ' + request.payload.lastName,
              address: request.payload.username
            }
          };
          const template = 'welcome';

          mailer.sendEmail(emailOptions, template, request.payload, (err) => {

            if (err) {
              console.warn('sending welcome email failed:', err.stack);
            }
          });

          done();
        }],
        session: ['linkUser', 'linkAccount', function (results, done) {

          Session.create(results.user._id.toString(), done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        const user = results.linkAccount;
        const account = results.linkUser;

        const credentials = results.session._id + ':' + results.session.key;
        const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

        const result = {
          user: {
            username: user.username,
            firstName: account.name.first,
            middleName: account.name.middle,
            lastName: account.name.last,
            yearOfInjury: account.yearOfInjury,
            gender: account.gender,
            siteNum: account.siteNum,
            comments: account.comments,
            tncAgreement: account.tncAgreement,
            lastPasswordChange: account.lastPasswordChange
          },
          session: results.session,
          authHeader: authHeader
        };
        console.log("result hai");
        console.log(result);
        request.cookieAuth.set(result);
        reply(result);
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
  name: 'signup'
};
