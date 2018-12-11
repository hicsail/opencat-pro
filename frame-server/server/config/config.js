/*Config holder for data sets etc*/
const initialQuestionList = require('../profile/initialQuestionList.json');
const descriptionList = require('../profile/sectionDescription.json');

const appConfig = require('../../config');

var Config = {

  descriptionList: new Map(),
  SERVER_URL: appConfig.get('/appUrl'), //Change this to be deploy url
  sectionSkipLowerLimit: 8,
  sectionSkipUpperLimit: 14,
  sectionSkipScoreThreshold: 0.22,
  maxInfoParameter: -100,
  initialSection: 4,

  findDescriptionBySection: function (sectionToLookFor) {
    console.log("finding description for section: "+parseInt(sectionToLookFor));
    console.log(descriptionList[sectionToLookFor]);
    return descriptionList[sectionToLookFor];
  },

  findFirstQuestionIDBySection: function (sectionToLookFor) {
    console.log("finding first question id for section:");
    console.log(parseInt(sectionToLookFor));
    console.log("Question number found is:");
    console.log(initialQuestionList[parseInt(sectionToLookFor)]);
    return initialQuestionList[parseInt(sectionToLookFor)];
  },

  getAppTitle: function () {
    return appConfig.get('/projectName');
  },

  getProfilePath: function () {
    return "../profile/";
  },

  getAppName: function () {
    return appConfig.get('/projectName');
  },

  getAppLogo: function () {
    return appConfig.get('/appLogoPath');
  },

  getAppIcon: function () {
    return appConfig.get('/appIconPath');
  }

};
module.exports = Config;
