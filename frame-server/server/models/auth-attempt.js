'use strict';
const Async = require('async');
const Config = require('../../config');
const Joi = require('joi');
const MongoModels = require('mongo-models');

class AuthAttempt extends MongoModels {
  static create(ip, callback) {

    const document = {
      ip,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }

  static abuseDetected(ip, callback) {
    const self = this;

    Async.auto({
      abusiveIpCount: function (done) {
        const outdatedAttempt = new Date(new Date() - Config.get('/outdatedAttemptMilliseconds'));
        self.count({ip: ip, time: {$gt: outdatedAttempt}}, done);
      }
    }, (err, results) => {

      if (err) {
        return callback(err);
      }

      const authAttemptsConfig = Config.get('/authAttempts');
      const ipLimitReached = results.abusiveIpCount >= authAttemptsConfig.forIp;

      callback(null, ipLimitReached);
    });
  }
}

AuthAttempt.collection = 'authAttempts';

AuthAttempt.schema = Joi.object().keys({
  _id: Joi.object(),
  ip: Joi.string().required(),
  time: Joi.date().required()
});

AuthAttempt.indexes = [
  { key: { ip: 1, time: 1 } }
];

module.exports = AuthAttempt;
