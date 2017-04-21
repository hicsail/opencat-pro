'use strict';

/**
 * Transform user demographic data to rules hash. Must be custom-defined for each project
 */


var businessRules = {};

(function () {

  businessRules.setProfileVariables = function (server, userid, userData, callback) {
    const User = server.plugins['hapi-mongo-models'].User;
    const Account = server.plugins['hapi-mongo-models'].Account;
    var profileData = {};

    //Prepare tags
    User.findByUserId(userid, function (user) {
      console.log("****TEST, user id is****");
      console.log(userid);
      console.log(user.roles.account);

      Account.findByAccountId(user.roles.account.id, function (account) {
        console.log("Account found using account id");
        console.log(account);
        var timeSinceBurn = new Date().getFullYear() - account.yearOfInjury;
        var timeField = timeSinceBurn > 0 && timeSinceBurn < 7;
        console.log(timeSinceBurn);

        profileData = {
          likeCat: 1
        };

      });

      callback(profileData);
    });

  };

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
