#!/usr/bin/env node
'use strict';

const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Handlebars = require('handlebars');
const MongoModels = require('mongo-models');
const adminOptions = require('./server/config/admin-options.js');

const configTemplatePath = Path.resolve(__dirname, 'config.example');
const configPath = Path.resolve(__dirname, 'config.js');


if (process.env.NODE_ENV === 'test') {
  const options = {encoding: 'utf-8'};
  const source = Fs.readFileSync(configTemplatePath, options);
  const configTemplateTest = Handlebars.compile(source);
  const context = adminOptions.options;

  Fs.writeFileSync(configPath, configTemplateTest(context));
  console.log('Setup complete.');
  process.exit(0);
}
//Need to change this file for production! Later, ideally these values should come in using a form
if (process.env.NODE_ENV === 'docker') {
  const options = {encoding: 'utf-8'};
  const source = Fs.readFileSync(configTemplatePath, options);
  const configTemplateTest = Handlebars.compile(source);
  const context = adminOptions.options;

  Fs.writeFileSync(configPath, configTemplateTest(context));

  //Now create required models
  const Account = require('./server/models/account');
  const Study = require('./server/models/study');
  const AdminGroup = require('./server/models/admin-group');
  const Admin = require('./server/models/admin');
  const AuthAttempt = require('./server/models/auth-attempt');
  const BlockedIp = require('./server/models/blocked-ip');
  const Session = require('./server/models/session');
  const Status = require('./server/models/status');
  const User = require('./server/models/user');
  const Score = require('./server/models/score');
  const StudySignup = require('./server/models/studySignupDetails');

  Async.auto({
    connect: function (done) {
      MongoModels.connect('mongodb://mongo:27017/frame', {}, done);
    },
    clean: ['connect', (dbResults, done) => {

      Async.parallel([
      Account.deleteMany.bind(Account, {}),
      Study.deleteMany.bind(Study, {}),
      AdminGroup.deleteMany.bind(AdminGroup, {}),
      Admin.deleteMany.bind(Admin, {}),
      AuthAttempt.deleteMany.bind(AuthAttempt, {}),
      BlockedIp.deleteMany.bind(BlockedIp, {}),
      Session.deleteMany.bind(Session, {}),
      Status.deleteMany.bind(Status, {}),
      User.deleteMany.bind(User, {}),
      Score.deleteMany.bind(Score, {}),
      StudySignup.deleteMany.bind(StudySignup, {})
    ], done);
}],
  adminGroup: ['clean', function (dbResults, done) {
    AdminGroup.create('Root', done);
    AdminGroup.create('Clinician', done);
  }],
    admin: ['clean', function (dbResults, done) {

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

      done(err, docs && docs[0]);
  });
  }],
    user: ['clean', function (dbResults, done) {

    Async.auto({
      passwordHash: User.generatePasswordHash.bind(this, results.rootPassword)
    }, (err, passResults) => {

      if (err) {
        return done(err);
      }

      const document = {
        _id: Admin.ObjectId('000000000000000000000000'),
        isActive: true,
        username: results.rootEmail.toLowerCase(),
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
          name: results.rootEmail
        }
      }
    };

    Admin.findByIdAndUpdate(id, update, done);
  }]
}, (err, dbResults) => {

    if (err) {
      console.error('Failed to setup root user.');
      return done(err);
    }

    done(null, true);
  });
}
