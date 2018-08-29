'use strict';
/**
 * This model holds a reference between created studies and patientIds/clinicianIDs associated with those studies.
 */

const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;
const MongoModels = require('mongo-models');


class StudySignup extends MongoModels {

  static create(patientId, clinicianId, studyId, accepted, callback) {

    const self = this;

    const document = {
      patientId: patientId,
      clinicianId: clinicianId,
      studyId: studyId,
      accepted: accepted
    };

    self.insertOne(document, (err, results) => {

      if (err) {
        return callback(err);
      }

      callback(null, results[0]);

    });

  };

  static findByStudyId(studyId, callback) {

    const query = {'_id': new ObjectID(studyId.toString())};
    StudySignup.findOne(query, function (err, docs) {
      callback(docs);
    });

  };

  static findByPatientId(patientId, callback) {

    const query = {
      'patientId': patientId.toString(),
      'accepted': false
    };

    StudySignup.findOne(query, function (err, docs) {
      callback(docs, err);
    });

  };

  static findByPatientEmail(patientEmail, callback) {

    const query = {
      'patientEmail': patientEmail.toString()
    };

    //Get most latest study for that patient.
    StudySignup.findOne(query, function (err, docs) {
      if(err){
        return callback(err);
      }
      callback(null, docs);
    });

  };

  static findByPatientEmailAndStudyId(patientEmail,studyId, callback) {
    const query = {
      'patientEmail': patientEmail.toString(),
      'studyId' : studyId.toString()
    };

    StudySignup.findOne(query, function (err, docs) {
      if(err){
        return callback(err);
      }else{
        console.log(docs);

      }
      callback(null, docs);
    });

  };



  static findAcceptedStudies(userId, callback) {

    const query = {'_id': userId, 'accepted': true};
    StudySignup.find(query, function (err, docs) {
      callback(docs);
    });

  };

}


StudySignup.collection = 'studySignup';
StudySignup.schema = Joi.object().keys({
  _id: Joi.object(),
  patientId: Joi.string().required(),
  clinicianId: Joi.string().required(),
  studyId: Joi.string().required(),
  accepted: Joi.boolean().required()
});


module.exports = StudySignup;
