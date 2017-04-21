'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');


class Question extends MongoModels {
  static findByQuestionID(sectionId, questionID, callback) {

    const filter = {'questionID': questionID, 'sectionID': sectionId};

    Question.find(filter, function (err, response) {
      if (err) {
        console.log("error in Response find");
        console.log(err);
        return reply(err);
      }
      callback(response[0]);
    });
  };

  static findUnansweredQuestions(filter, callback) {
    Question.find(filter, function (err, response) {
      if (err) {
        console.log("error in Response find");
        console.log(err);
        return reply(err);
      }
      callback(err, response);
    });
  };
}


Question.collection = 'questions';

Question.schema = Joi.object().keys({
  _id: Joi.object(),
  sectionID: Joi.number().integer().required(),
  ques_id_data: Joi.string().required(),
  questionID: Joi.number().integer().required(),
  slope: Joi.number().integer().required(),
  category: Joi.number().integer().required(),
  text: Joi.string().required(),
  skip: Joi.boolean().required(),

});


Question.indexes = [
  {key: {questionID: 1}}
];

module.exports = Question;
