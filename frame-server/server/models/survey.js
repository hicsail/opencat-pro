'use strict';

const Joi = require('joi');
var ObjectID = require('mongodb').ObjectID;
const MongoModels = require('mongo-models');

class Survey extends MongoModels {
  static create(userID, studyID, callback) {

    const document = {
      title: 'Survey',
      user_id: userID.toString(),
      study_id: studyID.toString(),
      completed: false,
      lastQuestion_id: 0,
      lastUpdated: new Date()
    };

    this.insertOne(document, function (err, docs) {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  };


  static findByUserID(userID, callback) {
    const query = {"user_id": userID};
    console.log(query);
    Survey.find(query, {}, function (err, docs) {
      if (err) {
        return callback(err);
      } else {
        console.log("found a SURVEY matching!")
        callback(docs);
      }
    });
  };

  static findBySurveyID(surveyID, callback) {
    const query = {'user_id': ObjectId(userID.toString())};
    console.log("in findBySurveyID, querying the survey collection with query ");
    console.log(query);
    this.find(query, {}, callback);
  };

  static updateAvailableSections(surveyId, availableSections, callback) {
    console.log("surveyid passed in is:");
    console.log(surveyId);

    const query = {'_id': new ObjectID(surveyId.toString())};
    Survey.findOneAndUpdate(query, {$set: {availableSections: availableSections}}, function (err, docs) {
      console.log("Adding sections array");
      console.log(docs);
      callback(docs.availableSections);
    });

  };

  static calculateNextEligibleSections(surveyId, sectionId, callback) {
    console.log("surveyid , sectionid passed in is:");
    console.log(surveyId, sectionId);

    const query = {'_id': new ObjectID(surveyId.toString())};
    Survey.findOne(query, function (err, docs) {
      console.log("Survey Item found:");
      console.log(docs);
      var nextSectionIndex = docs.availableSections.indexOf(parseInt(sectionId)) + 1;
      var result = docs.availableSections[nextSectionIndex];
      console.log("value is");
      console.log(result);
      //Return -1 if no more section exists
      callback(result ? result : -1);
    });

  };

  static updateCompletionStatus(surveyId, status, callback) {
    console.log("surveyid passed in is:");
    console.log(surveyId);

    const query = {'_id': new ObjectID(surveyId)};
    Survey.findOneAndUpdate(query, {$set: {completed:status}}, function (err, docs) {

      if (err) {
        return callback(err);
      } else {
        console.log("Successfully updated completion status");
        callback(docs);
      }
    });

  };
}


Survey.collection = 'surveys';

Survey.schema = Joi.object().keys({
  _id: Joi.object(),
  title: Joi.string().required(),
  user_id: Joi.string().required(),
  study_id: Joi.string().required(),
  completed: Joi.boolean().required(),
  lastQuestion_id: Joi.number().integer().required(),
  availableSections: Joi.object(),
  lastUpdated: Joi.date()
});


Survey.indexes = [
  {key: {user_id: 1}}
];

module.exports = Survey;
