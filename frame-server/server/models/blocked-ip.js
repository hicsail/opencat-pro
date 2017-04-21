'use strict';
const Async = require('async');
const Config = require('../../config');
const Joi = require('joi');
const MongoModels = require('mongo-models');

class BlockedIp extends MongoModels {
  static create(ip) {

    const document = {
      ip,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return console.error(err);
      }
    });
  }

  static checkIfBlocked(ip, callback) {
    const self = this;

    Async.auto({
      blockedIpCount: function (done) {
        const blockedPeriod = new Date(new Date() - Config.get('/blockedPeriodMilliseconds'));
        self.count({ip: ip, time: {$gt: blockedPeriod}}, done);
      }
    }, (err, results) => {

      if (err) {
        return callback(err);
      }

      const ipBlocked = results.blockedIpCount >= 1;

      callback(null, ipBlocked);
    });
  }
}

BlockedIp.collection = 'blockedIps';

BlockedIp.schema = Joi.object().keys({
  _id: Joi.object(),
  ip: Joi.string().required(),
  time: Joi.date().required()
});

BlockedIp.indexes = [
  { key: { ip: 1, time: 1 } }
];

module.exports = BlockedIp;
