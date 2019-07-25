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
  const Invite = server.plugins['hapi-mongo-models'].Invite;


  server.route({
    method: 'POST',
    path: '/signup/clinician',
    config: {
      validate: {
        payload: {
          username: Joi.string().email().lowercase().required(),
          password: Joi.string().min(10).required(),
          firstName: Joi.string().lowercase().required(),
          lastName: Joi.string().lowercase().required(),
          gender: Joi.string().lowercase().required(),
          middleName: Joi.string().lowercase().allow('').optional(),
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
              return reply(Boom.conflict('Username already in use.'));
            }

            reply(true);
          });
        }
      }, {
        assign: 'passwordValidation',
        method: function (request, reply) {
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {
            console.error(err);
            if (err) {
              return reply(Boom.badRequest('Password does not meet complexity rules.'));
            }

            reply(true);
          })
          ;
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
            first: request.payload.firstName,
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

          // add project name to the payload so it can be used in the email template
          request.payload.projectName = Config.get('/projectName');

          mailer.sendEmail(emailOptions, template, request.payload, (err) => {

            if (err) {
              console.warn('sending welcome email failed:', err.stack);
            }
          })
          ;

          done();
        }]
      }, (err, results) => {

        if (err) {
          console.log("Error creating clinician");
          return reply(err);
        }

        console.log("Successfully created new clinician!");

        const user = results.linkAdmin;

        const result = {
          user: {
            username: user.username,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
          },
        };
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
          firstName: Joi.string().required(),
          middleName: Joi.string().allow('').optional(),
          lastName: Joi.string().required(),
          gender: Joi.string().valid('male', 'female', 'other').required(),
          comments: Joi.string().allow('').optional(),
          dateOfBirth: Joi.string().required(),
          phoneNumber: Joi.string().required(),
          dynInfo: Joi.string().optional(),
          isThroughInvite: Joi.boolean(),
          inviteId: Joi.string(),
          studyId: Joi.string(),
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
              return reply(Boom.conflict('Username already in use.'));
            }

            reply(true);
          });
        }
      }, {
        assign: 'passwordValidation',
        method: function (request, reply) {
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {
            console.error(err);
            if (err) {
              return reply(Boom.badRequest('Password does not meet complexity rules.'));
            }

            reply(true);
          })
          ;
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;
      const username = request.payload.username;
      const password = request.payload.password;
      const gender = request.payload.gender;

      Async.auto({
        user: function (done) {

          User.create(username, password, gender, done);
        },
        studyDetails: ['user', function (results, done) {

          const studyId = request.payload.studyId;
          const email = results.user.username.toString();
          //update the study status for which a signup invite was sent.
          StudySignup.findByPatientEmailAndStudyId(email, studyId, done);
        }],
        updateInviteIfNeeded: ['studyDetails', function (results, done) {

          console.log("Updating invite status");
          console.log(request.payload.isThroughInvite);
          console.log(request.payload.inviteId);

          if (request.payload.isThroughInvite) {
            //Update invite to accepted status
            console.log("through invite....");
            //Change to accepted status
            const id = request.payload.inviteId;
            const update = {
              $set: {
                status: 'Accepted'
              }
            };

            Invite.findByIdAndUpdate(id, update, done);

          } else {
            //else continue on
            console.log("not through invite....");
            done();
          }
        }],
        study: ['updateInviteIfNeeded', function (results, done) {

          if (results.studyDetails) {
            const id = results.studyDetails.studyId.toString();
            const email = results.user.username.toString();

            Study.findById(id, (err, study) => {
              // if a study found and is active, change accepted = true
              if (study && study.isActive === true) {
                StudySignup.setStudyToAccepted(email,id, done);
              }
              else {
                console.log('study is null!');
              }
            })
            ;
          } else {
            console.log('found no study signup details for the given user id');
          }
          done();
        }],
        account: ['user', function (results, done) {
          const name = {
            first: request.payload.firstName,
            middle: request.payload.middleName,
            last: request.payload.lastName
          };
          const comments = request.payload.comments;
          const dateOfBirth = request.payload.dateOfBirth;
          const phoneNumber = request.payload.phoneNumber;
          const dynamicFields = JSON.parse(request.payload.dynInfo);
          const tncAgreement = request.payload.tncAgreement;
          const lastPasswordChange = new Date();

          Account.create(name, comments, lastPasswordChange, dateOfBirth, phoneNumber, dynamicFields, tncAgreement, done);
        }],
        linkUser: ['account', function (results, done) {

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
          let update = {
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

          // add project name to the payload so it can be used in the email template
          request.payload.projectName = Config.get('/projectName');

          mailer.sendEmail(emailOptions, template, request.payload, (err) => {

              if (err) {
                console.warn('sending welcome email failed:', err.stack);
              }
            }
          )
          ;

          done();
        }],
        session: ['linkUser', 'linkAccount', function (results, done) {
          Session.create(results.user._id.toString(), done);
        }]
      }, (err, results) => {

        if (err) {
          console.log(err);
          return reply(err);
        }

        const user = results.linkAccount;
        const account = results.linkUser;

        const credentials = results.session._id + ':' + results.session.key;
        const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');
        console.log("sending back user session....");

        const result = {
          user: {
            username: user.username,
            firstName: account.name.first,
            middleName: account.name.middle,
            lastName: account.name.last,
            gender: account.gender,
            comments: account.comments,
            tncAgreement: account.tncAgreement,
            lastPasswordChange: account.lastPasswordChange
          },
          session: results.session,
          authHeader: authHeader
        };
        request.cookieAuth.set(result);
        reply(result);
      })
      ;
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
