'use strict';

const Joi = require('joi');
const ObjectAssign = require('object-assign');
const MongoModels = require('mongo-models');


class OngoingSurvey extends MongoModels{
  static create (userId, surveyId, sectionId, questionId, callback) {
    //TODO introduce callback later
    const document = {
      userId: userId,
      surveyId: surveyId,
      sectionId: sectionId,
      questionId: questionId
    };

    this.insertOne(document, function (err, docs) {

      if (err) {
        console.log("error");
      }

      callback(null, docs[0]);
    });
  };

  static findByUserID (userID, callback) {

    const query = {'userId': userID};
    this.find(query, {}, callback);
  };
}


OngoingSurvey.collection = 'ongoingsurvey';


OngoingSurvey.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string().required(),
  surveyId: Joi.string().required(),
  sectionId: Joi.string().required(),
  questionId: Joi.string().required()
});


OngoingSurvey.indexes = [
  {key: {userId: 1}}
];

module.exports = OngoingSurvey;
