'use strict';

/**
 * Transform user demographic data to rules hash. Must be custom-defined for each project
 */


var businessRules = {};

(function () {

  /**
   * This function constructs a json object which consists of profile data.
   * Must be custom defined for each project.
   * @params {Object} server The current server instance.
   * @params {string} userid The desired user ID.
   * @params {function} callback The callback function to pass the profile data to.
   * @returns {Object} The profile data object.
   */

  businessRules.setProfileVariables = function (server, userid, callback) {
    const User = server.plugins['hapi-mongo-models'].User;
    const Account = server.plugins['hapi-mongo-models'].Account;
    var profileData = {};

    //Prepare tags
    User.findByUserId(userid, function (user) {
      console.log('user id is ', userid);
      console.log('user is', user);
      console.log('user roles is ', user.roles);

      Account.findByAccountId(user.roles.account.id, function (account) {
        console.log("Account found using account id");
        console.log(account);

        profileData = {
          likeCat: 1
        };

      });

      callback(profileData);
    });

  };

  /**
   * This function constructs a match query to be supplied to mongo.
   * This will be used to filter questions relevant to the user's demographics.
   * Must be custom defined for each project.
   * @params {Object} server The current server instance.
   * @params {string} userid The desired user ID.
   * @params {string} surveyId The desired survey ID.
   * @params {function} callback The callback function to pass the query to.
   * @returns {Object} The demographic filter query.
   */

  businessRules.getDemographicFilterQuery = function (server, userid, surveyId, callback) {

    const UserData = server.plugins['hapi-mongo-models'].UserData;

    UserData.findByUserAndSurveyId(userid, surveyId, function (userdata) {

      console.log("userdata");
      console.log(userdata);
      console.log("userdata.profileData");
      console.log(userdata[0]["profileData"]);

      var filter = {
        $and: [
          {pets: 1}

        ]
      };


      console.log("complex query is:");
      console.log(filter);
      callback({pets: 1});
    });
  };

  /**
   * This function constructs an array of relevant sections to be included in the survey.
   * This is based on the user's demographics.
   * Must be custom defined for each project.
   * @params {Object} server The current server instance.
   * @params {Object} userData A json hash of the users demographic choices
   * @params {function} callback The callback function to pass the section array to.
   * @returns {Object[]} The array of sections for that user.
   */

  businessRules.constructAvailableSectionArray = function (server, userData, callback) {

    var Survey = server.plugins['hapi-mongo-models'].Survey;
    var temp = [];
    temp.push(0,1);

    console.log("Available Sections are:");
    console.log(temp);

    Survey.updateAvailableSections(userData["surveyId"], temp, function (result) {
      //return sections array only after db save operation is successful
      callback(result);
    });

  };


})();

if (typeof module === 'object' && module.exports) {
  module.exports = businessRules;
}
