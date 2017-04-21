'use strict';
const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;
const MongoModels = require('mongo-models');


class Study extends MongoModels {

  static create(patientIds, isActive, callback) {

    const self = this;

    const document = {
      timeCreated: new Date(),
      patientIds: patientIds,
      isActive: isActive
    };

    self.insertOne(document, (err, results) => {

      if (err) {
        return callback(err);
      }

      callback(null, results[0]);

    });

  };

  static findByStudyId(studyId, callback) {

    const query = {'_id': studyId};
    Study.findOne(query, function (err, docs) {
      callback(docs);
    });

  };

  static findActiveStudies(acceptedStudies, callback) {

    const query = {'isActive': true};
    Study.find(query, function (err, docs) {

      var studyList = [];

      for(var i = 0; i < docs.length; i++) {
        const studyId = docs[i]._id;
        if(acceptedStudies.indexOf(studyId) != -1) {
          studyList.push(studyId);
        }
      }
      callback(studyList);
    });

  };

}


Study.collection = 'studys';
Study.schema = Joi.object().keys({
  _id: Joi.object(),
  timeCreated: Joi.date(),
  patientIds: Joi.array().items(Joi.string()),
  isActive: Joi.boolean().default(true)
});


module.exports = Study;
