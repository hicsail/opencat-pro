'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const Config = require('../config/config.js');
const dynamicSignupQuestions = require(Config.getProfilePath() + "/signup_dynamic_questions.json");


const internals = {};


internals.applyRoutes = function (server, next) {
  const Admin = server.plugins['hapi-mongo-models'].Admin;
  const StudySignup = server.plugins['hapi-mongo-models'].StudySignup;
  const Invite = server.plugins['hapi-mongo-models'].Invite;
  const User = server.plugins['hapi-mongo-models'].User;

  server.route({
    method: 'POST',
    path: '/invite',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required(),
          clinicianId: Joi.string().required(),
          studyId: Joi.string().required(),
          serverUrl: Joi.string().required()
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

      Async.auto({
        linkPatient: function (done) {
          console.log("updating patients....");
          Admin.updatePatients(request.auth.credentials.user.roles.admin.id, [request.payload.email], done);
        },
        checkIfUserExists: function(done){
          //check if this user already exists in system
          const patientEmail = request.payload.email;

          console.log("patient email is "+ patientEmail);
          User.findByUsername(patientEmail, function(err, user){
            console.log("err, user is")
            console.log(err, user)
            if(err){
              console.log("err"+ err);
              done(err,null);
            }else{
              console.log("Patient find status: "+ user && user.length > 0);
              done(null,(user && user.length > 0));
            }
          })
        },
        studySignup: ['checkIfUserExists',function (results,done) {
          const patientEmail = request.payload.email;
          const clinicianId = request.payload.clinicianId;
          const studyId = request.payload.studyId;

          let doesUserExist = results.checkIfUserExists;

          StudySignup.findByPatientEmailAndStudyId(patientEmail, studyId, function (error, details) {

            if (!error && !details) {
              //no signup details found, adding
              console.log("adding new StudySignup.. with value "+ doesUserExist);

              //set accept to true/false based on whether user already exists or not.
              StudySignup.create(patientEmail, clinicianId, studyId, doesUserExist, done);
            }
            else {
              done("Trying to add duplicate patients");
            }
          });

        }],
        invite: ['studySignup',function (results, done) {
          const studyId = request.payload.studyId;

          //create an invite only if the user does not exist in the system yet, otherwise it doesn't make sense.
          !results.checkIfUserExists ? Invite.create(request.payload.email, request.auth.credentials.user._id.toString(), request.payload.clinicianId, studyId, done): done();
        }],
        email: ['invite', function (results, done) {

          //Send an invite only if user exists, else send an email to login into the system
          let subject =  (results.checkIfUserExists? 'You have been added to a new study under ': 'You have been invited to ') + Config.getAppTitle();
          let templateString = results.checkIfUserExists ? 'new-study-invitation-existing-user':'new-study-invitation';
          let urlString = results.checkIfUserExists ? request.headers.origin + '/login' :request.headers.origin + '/api/invite/' + results.invite._id.toString()+'/'+ request.payload.studyId.toString();
          const emailOptions = {
            subject: subject,
            to: {
              name: request.payload.name,
              address: request.payload.email
            }
          };
          const template = templateString;
          const context = {
            url: urlString ,
            name: Config.getAppTitle()
          };
          const mailer = request.server.plugins.mailer;

          mailer.sendEmail(emailOptions, template, context, (err) => {

            if (err) {
              console.warn('sending invite email failed:', err.stack);
            }
          });

          done();
        }],

      }, (err, results) => {
        console.log("results");
      console.log(results);
      console.log("Email error");
      console.log(err);
      if (err) {
        console.log("replied an error");
        return reply(err);
      } else {
        console.log("replied successfully");
        return reply('Email sent');

      }
    });

    }
  });

  server.route({
    method: "GET",
    path: "/fetchInvites",
    config: {
      auth: {
        strategy: 'session'
      },
      pre: [{
        assign: 'clinicianCheck',
        method: function (request, reply) {
          let isAccount = request.auth.credentials.user.roles.account ? true : false;
          if (!isAccount) {
            Admin.findByUsername(request.auth.credentials.user.username, function (err, admin) {
              if (admin.isMemberOf('clinician') || admin.isMemberOf('root')) {
                reply();
              } else {
                return reply(Boom.badRequest('You must be a Admin to do that!'));
              }
            });
          } else {
            return reply(Boom.badRequest('You must be a Admin to do that!'));
          }
        }
      }]
    },
    handler: function (request, reply) {
      Invite.findByClinicianId(request.auth.credentials.user._id.toString(), function (err, docs) {
        if (err) {
          return reply(err);
        }
        reply(docs)
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/invite/{id}/{studyId}',
    config: {
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

      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      }
      Invite.findById(request.params.id, (err, invite) => {

        if (err) {
          return reply(err);
        }
        let valid = false;
      if (invite) {
        const date = new Date().getTime();

        if (invite.status === 'Pending' && date < invite.expiredAt.getTime()) {


          valid = true;
        }
      }
      console.log(invite);
      if(valid){
        return reply.view('register_accessible_invite', {
          title: Config.getAppTitle(),
          dynamicQuestions: dynamicSignupQuestions,
          configUrl: Config.SERVER_URL,
          emailToFill: invite.email,
          favicon: Config.getAppName() + "/logo.png",
          logoname: Config.getProfileLogo()
        });
      }else{
        return reply.view('invite_expired', {
          title: Config.getAppTitle(),
          configUrl: Config.SERVER_URL,
          favicon: Config.getAppName() + "/logo.png",
          logoname: Config.getProfileLogo()

        });
      }
    });
    }
  });

  server.route({
    method: 'PUT',
    path: '/invite/{id}/reject',
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          status: 'Reject'
        }
      };

      Invite.findByIdAndUpdate(id, update, (err, invite) => {

        if (err) {
          return reply(err);
        }

        if (!invite) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(invite);
    });
    }
  });

  server.route({
    method: 'PUT',
    path: '/invite/{id}/accept',
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          status: 'Accepted'
        }
      };

      Invite.findByIdAndUpdate(id, update, (err, invite) => {

        if (err) {
          return reply(err);
        }

        if (!invite) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(invite);
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
