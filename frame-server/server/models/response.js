'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Response extends MongoModels {
  static create(surveyID, questionID, choiceID, domainID, skip) {

    const document = {
      survey_id: surveyID,
      question_id: questionID,
      domain_id: domainID,
      choice_id: choiceID,
      skip: skip,
      ques_id_data: questionID.toString() + "_" + domainID.toString(),
      timeSubmitted: new Date()
    };

    this.insertOne(document, function (err) {

      if (err) {
        console.log(err)
        return false;
      }
      return true;
    });
  };

  static findBySurveyIDAndSectionID(surveyID, sectionID, callback) {
    const query = {'survey_id': surveyID, 'domain_id': sectionID};
    this.find(query,  function (err, result) {
      if (err) {
        console.log(err);
      }
      // console.log("callback");
      // console.log(result);
      callback(result);
    });
  };

  static findByQuestionID(questionID, callback) {

    const query = {'question_id': questionID};
    this.find(query, {}, callback);
  };

  static fetchQuestionAndAnswerData(surveyId, sectionId, callback) {

    var answeredQuestions = [];

    //Aggregate all unskipped, actually answered questions with ques data attach to construct arrays and calculate scope
    Response.aggregate([
        {
          $lookup: {from: "questions", localField: "ques_id_data", foreignField: "ques_id_data", as: "question_data"}
        },
        {$match: {survey_id: surveyId}},
        {$match: {domain_id: sectionId}},
        {$match: {skip:false}},
        {$unwind: "$ques_id_data"}

      ],
      function (err, response) {
        if (err) {
          console.log("error in Response find");
          console.log(err);
          return reply(err);
        }
        console.log("visited with question data being returned....");
        console.log(response);
        answeredQuestions = response;
        callback(answeredQuestions);
      });
  };
}

Response.collection = 'responses';


Response.schema = Joi.object().keys({
  _id: Joi.object(),
  survey_id: Joi.string().required(),
  ques_id_data: Joi.string().required(),
  question_id: Joi.number().integer().required(),
  choice_id: Joi.number().integer().required(),
  domain_id: Joi.number().integer().required(),
  skip: Joi.boolean().required(),
  timeSubmitted: Joi.date()
});


Response.indexes = [
  {key: {survey_id: 1}}
];

module.exports = Response;
