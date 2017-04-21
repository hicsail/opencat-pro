'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class UserData extends MongoModels {
  static create(userId, userData, profileData, callback) {

    const document = {
      userId: userId,
      profileData: profileData,
      userData: userData
    };

    this.insertOne(document, function (err, docs) {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  };


  static findByUserAndSurveyId(userId, surveyId, callback) {
    const query = {'userId': userId, "userData.surveyId": surveyId};
    UserData.find(query, function (err, result) {
      if(err){
        return err;
      }
      console.log("User data found is....");
      console.log(result);
      callback(result);
    });
  };
}

UserData.collection = 'userdata';

UserData.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string().required(),
  surveyId: Joi.string().required(),
  doesWalk: Joi.boolean().default(true).required(),
  married: Joi.boolean().default(true).required(),
  usesMWC: Joi.boolean().default(true).required(),
  usesPWC: Joi.boolean().default(true).required(),
  liveCondo: Joi.boolean().default(true).required(),
  bladder: Joi.boolean().default(true).required(),
  disabilityPara: Joi.boolean().default(true).required(),
  g1_1: Joi.number().integer().required(),
  g1_2: Joi.number().integer().required(),
  g2_1: Joi.number().integer().required(),
  g2_2: Joi.number().integer().required(),
  g4_1: Joi.number().integer().required(),
  g4_2: Joi.number().integer().required(),
  g6_1: Joi.number().integer().required(),
  g6_2: Joi.number().integer().required(),
  g7_1: Joi.number().integer().required(),
  g7_2: Joi.number().integer().required(),
  g8_1: Joi.number().integer().required(),
  g8_2: Joi.number().integer().required(),
  g9_1: Joi.number().integer().required(),
  g9_2: Joi.number().integer().required(),
  g11_1: Joi.number().integer().required(),
  g11_2: Joi.number().integer().required(),
  g12_1: Joi.number().integer().required(),
  g12_2: Joi.number().integer().required(),
  g13_1: Joi.number().integer().required(),
  g13_2: Joi.number().integer().required()

});


UserData.indexes = [
  {key: {userId: 1}}
];

module.exports = UserData;
