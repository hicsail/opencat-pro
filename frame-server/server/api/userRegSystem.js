/*User Specific Routes- Login, Register etc.*/


'use strict';
const internals = {};

let Config = require("../config/config.js");
const helperMethods = require('../helperMethods.js'); //http://stackoverflow.com/questions/5726729/how-to-parse-json-using-node-js
const homeJSON = require(Config.getProfilePath() + "/homepage_text.json");
const Boom = require('boom');
const FeatureToggles = require('../config/feature-toggles.js');
const contactJSON = require(Config.getProfilePath() + "/contact_info.json");
const helpJSON = require(Config.getProfilePath() + "/help_text.json");
let logoName =  "logo.png";
const dynamicSignupQuestions = require(Config.getProfilePath() + "/signup_dynamic_questions.json");
const Joi = require('joi');

internals.applyRoutes = function (server, next) {
  const Admin = server.plugins['hapi-mongo-models'].Admin;
  const Study = server.plugins['hapi-mongo-models'].Study;
  const User = server.plugins['hapi-mongo-models'].User;
  const NoteEntry = server.plugins['hapi-mongo-models'].NoteEntry;
  const Invite = server.plugins['hapi-mongo-models'].Invite;


  server.route({
    method: "GET",
    path: "/helpText",
    handler: function (request, reply) {
      return reply(helpJSON);
    }
  });

  server.route({
    method: "GET",
    path: "/public/{param*}",
    handler: {
      directory: {
        path: "./server/web/public",
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      let majorText = homeJSON["major_text"];
      let instructions = homeJSON["instructions"];
      let minorText = homeJSON["minor_text"];

      if (request.auth.isAuthenticated) {
        let isAccount = request.auth.credentials.user.roles.account;
        if (!isAccount) {
          //admin role
          return reply.view('home_accessible', {
            title: Config.getAppTitle(),
            majorText: majorText,
            minorText: minorText,
            instructions: instructions,
            helpTextOn: FeatureToggles.TOGGLE_HELP_TEXT,
            configUrl: Config.SERVER_URL,
            loggedIn: true,
            isClinician: true,
            favicon: logoName,
            logoname: logoName,
            studies: {},
            name: request.auth.credentials.user.roles.admin.name
          });

        } else {
          const userID = request.auth.credentials.user._id;
          helperMethods.getActiveStudies(server, userID, function (result) {
            return reply.view('home_accessible', {
              title: Config.getAppTitle(),
              majorText: majorText,
              minorText: minorText,
              instructions: instructions,
              helpTextOn: FeatureToggles.TOGGLE_HELP_TEXT,
              configUrl: Config.SERVER_URL,
              favicon: logoName,
              logoname: logoName,
              loggedIn: true,
              isClinician: false,
              name: request.auth.credentials.user.roles.account.name,
              studies: result
            });
          });
        }

      } else {
        return reply.view('home_accessible', {
          title: Config.getAppTitle(),
          majorText: majorText,
          minorText: minorText,
          instructions: instructions,
          helpTextOn: FeatureToggles.TOGGLE_HELP_TEXT,
          configUrl: Config.SERVER_URL,
          favicon: logoName,
          logoname: logoName,
          loggedIn: false,
          isClinician: false,
          name: ''
        });
      }

    }
  });

  server.route({
    method: "GET",
    path: "/registerClinician",
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {
      if (request.auth.isAuthenticated) {
        return reply.view('registerclinician_accessible',
          {
            title: 'Create a clinician',
            configUrl: Config.SERVER_URL,
            favicon: logoName,
            logoname: logoName,
            loggedIn: true,
            isClinician: true,
            name: request.auth.credentials.user.roles.admin.name
          });
      } else {
        return reply.redirect('/');
      }

    }
  });

  server.route({
    method: 'POST',
    path: '/toggleActive',
    config: {
      auth: {
        strategy: 'session',
        scope: 'admin'
      },
      validate: {
        payload: {
          username: Joi.string().lowercase().required()
        }
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
      User.toggleActive(request.payload.username, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(user);

    });
    }
  });

  server.route({
    method: "GET",
    path: "/login",
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {
      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      }

      return reply.view('login_accessible', {
        title: Config.getAppTitle(),
        configUrl: Config.SERVER_URL,
        favicon: logoName,
        logoname: logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/register",
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('register_accessible', {
        title: Config.getAppTitle(),
        dynamicQuestions: dynamicSignupQuestions,
        configUrl: Config.SERVER_URL,
        favicon: logoName,
        logoname: logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/forgot",
    handler: function (request, reply) {
      return reply.view('forgot_accessible', {
        title: Config.getAppTitle(),
        favicon: logoName,
        configUrl: Config.SERVER_URL,
        logoname: logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/contact",
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      let officePhone = contactJSON["office_phone"];
      let directPhone = contactJSON["direct_phone"];
      let email = contactJSON["email"];
      let name = contactJSON["email"] ? contactJSON["email"] : "";
      if (request.auth.isAuthenticated) {
        let isAccount = request.auth.credentials.user.roles.account ? true : false;
        if (!isAccount) {
          return reply.view('contact_accessible', {
            title: Config.getAppTitle(),
            officePhone: officePhone,
            directPhone: directPhone,
            email: email,
            favicon: logoName,
            configUrl: Config.SERVER_URL,
            logoname: Config.getProfileLogo(),
            loggedIn: true,
            isClinician: true,
            contactName: name,
            name: request.auth.credentials.user.roles.admin.name,

          });

        } else {
          return reply.view('contact_accessible', {
            title: Config.getAppTitle(),
            officePhone: officePhone,
            directPhone: directPhone,
            email: email,
            favicon: logoName,
            configUrl: Config.SERVER_URL,
            logoname: Config.getProfileLogo(),
            loggedIn: true,
            isClinician: false,
            contactName: name,
            name: request.auth.credentials.user.roles.account.name,
          });
        }
      }
      else {
        return reply.view('contact_accessible', {
          title: Config.getAppTitle(),
          officePhone: officePhone,
          directPhone: directPhone,
          email: email,
          favicon: logoName,
          configUrl: Config.SERVER_URL,
          loggedIn: false,
          logoname: Config.getProfileLogo(),
          isClinician: false,
          name: ''
        });
      }
    }
  });

  server.route({
    method: "GET",
    path: "/reset",
    handler: function (request, reply) {
      return reply.view('reset_accessible', {
        title: Config.getAppTitle(),
        favicon: logoName,
        configUrl: Config.SERVER_URL,
        logoname: Config.getProfileLogo()
      });
    }
  });

  server.route({
    method: "GET",
    path: "/surveylist",
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {
      let isAccount = request.auth.credentials.user.roles.account ? true : false;

      return reply.view('userSurveyDetails_temp', {
        title: Config.getAppTitle(),
        favicon: logoName,
        logoname: Config.getProfileLogo(),
        configUrl: Config.SERVER_URL,
        meanScore: Config.meanScoreValue,
        loggedIn: request.auth.isAuthenticated,
        name: request.auth.isAuthenticated ? (isAccount ? request.auth.credentials.user.roles.account.name : request.auth.credentials.user.roles.admin.name) : '',
        isClinician: !isAccount,
        previewScoresOn: FeatureToggles.TOGGLE_PREVIEW_SCORES,
        sectionArray: Config.chartLabels,
        userid: (request.query['id'] || "")
      });

    }
  });

  server.route({
    method: "GET",
    path: "/invite",
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
      let isAccount = request.auth.credentials.user.roles.account ? true : false;
      return reply.view('invite_accessible', {
        title: "Invite",
        configUrl: Config.SERVER_URL,
        name: isAccount ? request.auth.credentials.user.roles.account.name : request.auth.credentials.user.roles.admin.name,
        isClinician: true,
        logoname: Config.getProfileLogo(),
        loggedIn: true,
        favicon: logoName,
        username: request.auth.credentials.user.username
      });
    }
  });

  server.route({
    method: "GET",
    path: "/dashboard",
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
      Study.findByClinician(request.auth.credentials.user.username, function (err, result) {
        if (err) {
          console.error(err);
        }

        let isAccount = request.auth.credentials.user.roles.account ? true : false;
        return reply.view('dashboard_accessible', {
          title: "My Dashboard",
          configUrl: Config.SERVER_URL,
          name: isAccount ? request.auth.credentials.user.roles.account.name : request.auth.credentials.user.roles.admin.name,
          isClinician: true,
          favicon: logoName,
          username: request.auth.credentials.user.username,
          studies: result,
          id: request.auth.credentials.user._id,
          logoname: Config.getProfileLogo()
        });
      });
    }
  });

  server.route({
    method: "GET",
    path: "/fetchPatients",
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
      Admin.findByUsername(request.auth.credentials.user.username, function (err, admin) {
        if (err) {
          return reply(err);
        }
        //accounts for when no patients are there
        let patients = (admin.patientIds && admin.patientIds.length > 0) ? admin.patientIds : [];

        //Returns only patients who have a valid user account and have signed up.
        User.find({username: {$in: patients}}, function (err, docs) {
          if (err) {
            return reply(err);
          }

          reply(docs);
        })


      });
    }
  });


  server.route({
    method: 'POST',
    path: '/api/notes',
    config: {
      validate: {
        payload: {
          text: Joi.string().required(),
          surveyId: Joi.string().required(),
        }
      },
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {
      NoteEntry.create(request.payload.text, request.payload.surveyId, function (err, done) {
        if (err) {
          return reply(err)
        }
        return reply({"text": "Thanks for your feedback!"});
      });

    }
  });


  next();
}
;

exports.register = function (server, options, next) {
  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);
  next();
};

exports.register.attributes = {
  name: 'userReg',
  dependencies: 'visionary'
};
