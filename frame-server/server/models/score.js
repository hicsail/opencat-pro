'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Score extends MongoModels{

  static create (surveyId, sectionId, score, callback) {
    const document = {
      surveyId: surveyId,
      score: new Object()
    };
    document.score[sectionId] = score;

    Score.insertOne(document, function (err, docs) {

      if (err) {
        return callback(err);
      }

      callback(docs[0]);
    });
  };

  static updateScoreForSection (surveyId, sectionId, score, callback) {
    var scoreToUpdate = new Object();
    scoreToUpdate["score." + sectionId.toString()] = score;
    Score.updateOne({surveyId: surveyId.toString()}, {$set: scoreToUpdate}, function (err) {

      if (err) {
        console.log("error!!")
      }

      callback();
    })

  };

  static findBySurveyID (surveyID, callback) {

    const query = {'surveyId': surveyID};
    console.log("Query");
    console.log(query);

    Score.find(query, function (err, docs) {

      if (err) {
        return callback(err);
      } else {

        console.log("found a score matching!");
        callback(docs[0]);
      }
    });
  };

  static findBySurveyIDs (surveyIDs, callback) {

    const query = { "surveyId": { '$in': surveyIDs } };
    console.log("Query");
    console.log(query);

    Score.find(query, {}, function (err, docs) {

      if (err) {
        return callback(err);
      } else {
        console.log("found ALL scores matching!")
        callback(docs);
      }
    });
  }

}
Score.collection = 'Score';

Score.schema = Joi.object().keys({
  _id: Joi.object(),
  surveyId: Joi.string().required(),
  score: Joi.object().required(),
});


Score.indexes = [
  {key: {surveyId: 1}}
];

module.exports = Score;
