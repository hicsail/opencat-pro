'use strict';
const Account = require('./account');
const Admin = require('./admin');
const Async = require('async');
const Bcrypt = require('bcryptjs');
const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;
const MongoModels = require('mongo-models');


class User extends MongoModels {
  static generatePasswordHash(password, callback) {

    Async.auto({
      salt: function (done) {

        Bcrypt.genSalt(10, done);
      },
      hash: ['salt', function (results, done) {
        Bcrypt.hash(password, results.salt, done);
      }]
    }, (err, results) => {

      if (err) {
        return callback(err);
      }

      console.log("After calculating");
      console.log(results);

      callback(null, {
        password,
        hash: results.hash
      });
    });
  }

  static create(username, password,gender , callback) {
    const self = this;

    Async.auto({
      passwordHash: this.generatePasswordHash.bind(this, password),
      newUser: ['passwordHash', function (results, done) {

        User.schema.validate({
          username: username,
          gender: gender,
          password: password
        }, (err, value) => {
          if (err) {
            return done(err);
          }
        });


        const document = {
          isActive: true,
          username: username.toLowerCase(),
          gender: gender,
          password: results.passwordHash.hash,
          timeCreated: new Date()
        };

        self.insertOne(document, done);
      }]
    }, (err, results) => {

      if (err) {
        return callback(err);
      }

      results.newUser[0].password = results.passwordHash.password;

      callback(null, results.newUser[0]);
    });
  };

  static findByUserId(userid, callback) {

    const query = {'_id': new ObjectID(userid.toString())};
    User.findOne(query, function (err, docs) {
      callback(docs);
    });

  };

  static findByCredentials(username, password, callback) {

    const self = this;

    Async.auto({
      user: function (done) {

        const query = {
          isActive: true,
          username: username.toLowerCase()
        };

        self.findOne(query, done);
      },
      passwordMatch: ['user', function (result, done) {
        if (!result.user) {
          return done(null, false);
        }

        const source = result.user.password;
        Bcrypt.compare(password, source, done);
      }]
    }, (err, results) => {

      if (err) {
        return callback(err);
      }

      if (results.passwordMatch) {
        return callback(null, results.user);
      }

      callback();
    });
  }

  static findByUsername(username, callback) {

    const query = {username: username.toLowerCase()};

    this.findOne(query, callback);
  }

  constructor(attrs) {

    super(attrs);

    Object.defineProperty(this, '_roles', {
      writable: true,
      enumerable: false
    });
  }

  canPlayRole(role) {

    if (!this.roles) {
      return false;
    }

    return this.roles.hasOwnProperty(role);
  }

  hydrateRoles(callback) {

    if (!this.roles) {
      this._roles = {};
      return callback(null, this._roles);
    }

    if (this._roles) {
      return callback(null, this._roles);
    }

    const self = this;
    const tasks = {};

    if (this.roles.account) {
      tasks.account = function (done) {

        Account.findById(self.roles.account.id, done);
      };
    }

    if (this.roles.admin) {
      tasks.admin = function (done) {

        Admin.findById(self.roles.admin.id, done);
      };
    }

    Async.auto(tasks, (err, results) => {

      if (err) {
        return callback(err);
      }

      self._roles = results;

      callback(null, self._roles);
    });
  }
}


User.collection = 'users';
User.schema = Joi.object().keys({
  _id: Joi.object(),
  gender: Joi.string().valid('male', 'female').required(),
  isActive: Joi.boolean().default(true),
  username: Joi.string().email().lowercase().required(),
  password: Joi.string().min(7),
  roles: Joi.object().keys({
    admin: Joi.object().keys({id: Joi.string().required(), name: Joi.string().required()}),
    account: Joi.object().keys({id: Joi.string().required(), name: Joi.string().required()}),
  }),
  timeCreated: Joi.date()
});


User.indexes = [
  {key: {username: 1, unique: true}},
  {key: {email: 1, unique: true}}
];


module.exports = User;
