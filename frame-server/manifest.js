'use strict';

const Confidence = require('confidence');
const Config = require('./config');


const criteria = {
  env: process.env.NODE_ENV
};


const manifest = {
  $meta: 'This file defines the plot device.',
  server: {
    debug: {
      request: ['error']
    },
    connections: {
      routes: {
        security: true
      }
    }
  },
  connections: [{
    port: Config.get('/port/web'),
    labels: ['web']
  }],
  registrations: [
    {
      plugin: 'hapi-auth-basic'
    },
    {
      plugin: 'hapi-auth-cookie'
    },
    {
      plugin: 'lout'
    },
    {
      plugin: 'inert'
    },
    {
      plugin: 'vision'
    },
    {
      plugin: {
        register: 'visionary',
        options: {
          engines: {ejs: 'ejs'},
          relativeTo: __dirname,
          path: 'server/web/views'
        }
      }
    },
    {
      plugin: {
        register: 'hapi-mongo-models',
        options: {
          mongodb: Config.get('/hapiMongoModels/mongodb'),
          models: {
            Account: './server/models/account',
            Study: './server/models/study',
            AdminGroup: './server/models/admin-group',
            Admin: './server/models/admin',
            AuthAttempt: './server/models/auth-attempt',
            BlockedIp: './server/models/blocked-ip',
            Response: './server/models/response',
            Session: './server/models/session',
            Status: './server/models/status',
            Survey: './server/models/survey',
            User: './server/models/user',
            UserData: './server/models/userdata',
            OngoingSurvey: './server/models/ongoingsurvey',
            Question: './server/models/question',
            Score: './server/models/score',
            StudySignup: './server/models/studySignupDetails'
          },
          autoIndex: Config.get('/hapiMongoModels/autoIndex')
        }
      }
    },
    {
      plugin: './server/auth'
    },
    {
      plugin: './server/mailer'
    },
    {
      plugin: './server/api/accounts',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/admin-groups',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/admins',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/auth-attempts',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/contact',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/index',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/login',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/logout',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/sessions',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/signup',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/statuses',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/users',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/surveys'
    },
    {
      plugin: './server/api/userRegSystem'
    },
    {
      plugin: './server/api/invite',
      options: {
        routes: {prefix: '/api'}
      }
    },
  ]
};


const store = new Confidence.Store(manifest);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
