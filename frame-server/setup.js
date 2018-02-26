#!/usr/bin/env node
'use strict';

const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Handlebars = require('handlebars');
const MongoModels = require('mongo-models');

const configTemplatePath = Path.resolve(__dirname, 'config.example');
const configPath = Path.resolve(__dirname, 'config.js');

console.log("Env: " + process.env.NODE_ENV);
if (process.env.NODE_ENV === 'test') {
  const options = {encoding: 'utf-8'};
  const source = Fs.readFileSync(configTemplatePath, options);
  const configTemplateTest = Handlebars.compile(source);
  const context = {
    projectName: 'Frame',
    rootEmail: 'root@root',
    rootPassword: 'rootroot',
    rootFirst: 'root',
    rootLast: 'root',
    rootBirthday: '2016-07-22T19:18:18.403Z',
    rootGender: 'male',
    systemEmail: 'sys@tem',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUsername: '',
    smtpPassword: ''
  };
  Fs.writeFileSync(configPath, configTemplateTest(context));
}

//Need to change this file for production! Later, ideally these values should come in using a form
const options = {encoding: 'utf-8'};
const source = Fs.readFileSync(configTemplatePath, options);
const configTemplateTest = Handlebars.compile(source);
const context = {
  projectName: 'BYO-CAT',
  rootEmail: 'root@root',
  rootPassword: 'rootroot',
  rootFirst: 'root',
  rootLast: 'root',
  rootBirthday: '2016-07-22T19:18:18.403Z',
  rootGender: 'male',
  systemEmail: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  //Change credentials below
  smtpUsername: 'youremail@gmail.com',
  smtpPassword: '1231231123'
};

Fs.writeFileSync(configPath, configTemplateTest(context));

//Now create required models
const AdminGroup = require('./server/models/admin-group');
const Admin = require('./server/models/admin');
const User = require('./server/models/user');

Async.auto({
  connect: function (done) {
    MongoModels.connect('mongodb://mongo-byocat:27017/frame', {}, done);
  },
  adminGroup: ['connect', function (dbResults, done) {
    Async.auto({
      createRootGroup: function(done) {
        AdminGroup.create('Root', done);
      },
      createClinicianGroup: function(done) {
        AdminGroup.create('Clinician', done);
      }
    }, (err) => {
      if (err) {
        return done(err);
      }

      done();
  });
  }],
  admin: ['connect', function (dbResults, done) {
    const document = {
      _id: Admin.ObjectId('111111111111111111111111'),
      name: {
        first: 'Root',
        middle: '',
        last: 'Admin'
      },
      timeCreated: new Date()
    };

    Admin.insertOne(document, (err, docs) => {
      if (err) {
        console.error(err);
      }

      done(err, docs && docs[0]);
  });
  }],
  user: ['connect', function (dbResults, done) {
    Async.auto({
      passwordHash: function(done) {
        User.generatePasswordHash(context.rootPassword, done);
      }
    }, (err, passResults) => {
      if (err) {
        return done(err);
      }

      const document = {
        _id: Admin.ObjectId('000000000000000000000000'),
        isActive: true,
        username: context.rootEmail.toLowerCase(),
        password: passResults.passwordHash.hash,
        timeCreated: new Date()
      };

    User.insertOne(document, (err, docs) => {

      done(err, docs && docs[0]);
  });
  });
  }],
  adminMembership: ['admin', function (dbResults, done) {
    const id = dbResults.admin._id.toString();
    const update = {
      $set: {
        groups: {
          root: 'Root'
        }
      }
    };

    Admin.findByIdAndUpdate(id, update, done);
  }],
  linkUser: ['admin', 'user', function (dbResults, done) {
    const id = dbResults.user._id.toString();
    const update = {
      $set: {
        'roles.admin': {
          id: dbResults.admin._id.toString(),
          name: 'Root Admin'
        }
      }
    };

    User.findByIdAndUpdate(id, update, done);
  }],
  linkAdmin: ['admin', 'user', function (dbResults, done) {
    const id = dbResults.admin._id.toString();
    const update = {
      $set: {
        user: {
          id: dbResults.user._id.toString(),
          name: context.rootEmail
        }
      }
    };

    Admin.findByIdAndUpdate(id, update, done);
  }]
}, (err, dbResults) => {

  if (err) {
    console.error('Failed to setup root user.');
    console.error(err);
  }

  console.log("Root user setup complete");
process.exit(0);
})
;

