'use strict';
/**
 * This model holds a user demographic data.
 */


const Joi = require('joi');
const MongoModels = require('mongo-models');

class UserData extends MongoModels {
  static create(userId, userData, profileData, callback) {

    const document = {
      userId: userId,
      profileData: profileData,
      userData: userData,
      surveyId: userData["surveyId"]
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
  userData: Joi.object(),
  profileData: Joi.object(),
  surveyId:Joi.string().required()

});


UserData.indexes = [
  {key: {userId: 1}}
];

module.exports = UserData;
