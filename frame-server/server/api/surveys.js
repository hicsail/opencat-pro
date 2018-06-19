/*Survey Specific Routes*/

'use strict';

const Joi = require('joi');
const locale = require('locale');
const Config = require('../config/config.js');
const demographicJSON = require('../profile/demographics.json');
const helperMethods = require('../helperMethods.js'); //http://stackoverflow.com/questions/5726729/how-to-parse-json-using-node-js
const businessRules = require('../profile/lib/businessRules.js'); //http://stackoverflow.com/questions/5726729/how-to-parse-json-using-node-js

const internals = {};
var questionNum;


internals.applyRoutes = function (server, next) {

  const Survey = server.plugins['hapi-mongo-models'].Survey;
  const Response = server.plugins['hapi-mongo-models'].Response;
  const Score = server.plugins['hapi-mongo-models'].Score;
  const Question = server.plugins['hapi-mongo-models'].Question;
  const Admin = server.plugins['hapi-mongo-models'].Admin;

  var returnDataToWebpage = function (result, reply) {
    return reply.view('chart_temp', {
      surveyScores: result
    });
  };

  server.route({
    method: 'GET',
    path: '/survey/getCharts',
    handler: function (request, reply) {
      var userId = request.url.query.userID;
      helperMethods.constructSurveyIdArray(server, userId, helperMethods.getAllScores, returnDataToWebpage, reply);
    }
  });
  server.route({
    method: 'GET',
    path: '/survey/start/{studyId*}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {
      var studyId = request.params.studyId ? request.params.studyId : "Self"
      const id = request.auth.credentials.user._id.toString();
      let isAccount = request.auth.credentials.user.roles.account ? true : false;
      if (!isAccount) {
        //admin
        Admin.findByUsername(request.auth.credentials.user.username, function (err, admin) {

          //admin found, check his group
          if (admin.isMemberOf('clinician')) {
            console.log("Success! It's a clinician");
          }

        });
      }

      Survey.create(id, studyId, function (err, createdSurvey) {
        if (err) {
          return reply(err);
        }
        return reply.view('surveyuserinfo_accessible', {
          title: Config.getAppTitle(),
          configUrl: Config.SERVER_URL,
          questions: demographicJSON,
          locales: new locale.Locales(request.headers["accept-language"], 'en'),
          getLocaleResource: helperMethods.getLocaleResource,
          createdSurveyId: createdSurvey._id,
          logoname: "/logo.png",
          favicon: "/logo.png",
          name: isAccount ? request.auth.credentials.user.roles.account.name : request.auth.credentials.user.roles.admin.name

        });

      });
    }
  });

  server.route({
    method: 'POST',
    path: '/survey/storeuserdata',
    config: {
      auth: {
        strategy: 'session'
      }
    },

    handler: function (request, reply) {

      const userId = request.payload.userId.toString();

      //TODO needs to be a hash instead of the payload
      const userData = JSON.parse(request.payload.userData);

      console.log("userdata hash is:");
      console.log(userData);
      console.log(request.payload);

      //Construct Available score Array based on questions answered in the demographics section in the background

      businessRules.constructAvailableSectionArray(server, userData, function (result) {

        //Send back description of first available section
        console.log("available section array is");
        console.log(result);

        //default to section id 4 if not found.
        var sectionId = result ? result[0] : Config.initialSection;
        var description = Config.findDescriptionBySection(sectionId);
        var locales = new locale.Locales(request.headers["accept-language"], 'en');

        return reply.view('descriptiontemplate_accessible', {
          title: helperMethods.getLocaleResource(locales, description.title),
          text: helperMethods.getLocaleResource(locales, description.text),
          questionId: 0,
          sectionId: sectionId,
          type: "description",
          isDescription: true
        });
      });

      //add tags to be used later when retrieving questions. No callback necessary
      helperMethods.constructAndStoreUserTags(server, userId, userData);
    }
  });

  server.route({
    method: 'POST',
    path: '/survey/nextItem',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      validate: {
        payload: {
          questionId: Joi.string().required(),
          sectionId: Joi.string().required(),
        },
        options: {
          allowUnknown: true
        }
      },
      handler: function (request, reply) {
        var questionId = parseInt(request.payload.questionId);
        var sectionId = parseInt(request.payload.sectionId);
        var choiceId = parseInt(request.payload.response);
        var surveyID = request.payload.surveyId;
        var isSkipped = request.payload.isSkipped;
        var userId = request.payload.userID;

        console.log("questionId received " + questionId);
        console.log("sectionID received in route" + sectionId);
        if (request.payload.questionId <= 0) {
          //and updated if necessary

          Score.findBySurveyID(surveyID, function (result) {
            console.log("Existing score tuple for this section found");
            console.log(result);
            var score = {currentScore: 0, stdError: 1};
            if (!result) {
              console.log("will create new score");
              Score.create(surveyID, sectionId, score, function (score) {
                Question.findByQuestionID(sectionId, Config.findFirstQuestionIDBySection(sectionId), function (question) {
                  console.log("*******found first question for above sectionID********\n");
                  console.log(question);

                  var locales = new locale.Locales(request.headers["accept-language"], 'en');

                  return reply.view('questiontemplate', {
                    text: helperMethods.getLocaleResource(locales, question.text),
                    questionId: question.questionID,
                    sectionId: sectionId,
                    surveyId: surveyID,
                    replyOptions: question.response_options,
                    type: "question",
                    isDescription: false,
                    locales: locales,
                    getLocaleResource: helperMethods.getLocaleResource
                  });

                });
              });

            } else {
              console.log("will update current score");
              //just update with default value
              Score.updateScoreForSection(surveyID, sectionId, score, function (score) {
                Question.findByQuestionID(sectionId, Config.findFirstQuestionIDBySection(sectionId), function (question) {
                  console.log("*******found next! question for above sectionID********\n");
                  console.log(question);

                  var locales = new locale.Locales(request.headers["accept-language"], 'en');

                  return reply.view('questiontemplate', {
                    text: helperMethods.getLocaleResource(locales, question.text),
                    questionId: question.questionID,
                    sectionId: sectionId,
                    surveyId: surveyID,
                    replyOptions: question.response_options,
                    type: "question",
                    isDescription: false,
                    locales: locales,
                    getLocaleResource: helperMethods.getLocaleResource
                  });

                });

              });
            }

          });

        } else {

          //Save response first since you would need it in score calculation to decide flow
          Response.create(surveyID, parseInt(questionId), parseInt(choiceId), parseInt(sectionId), isSkipped === "true");

          //Calculate score based on responses till now for this given section
          helperMethods.load_response(server, sectionId, surveyID, function () {

            //Check to move to next section or render next quesiton
            console.log("Callback after calculating response");

            helperMethods.canMoveToNextSection(userId, server, sectionId, surveyID, function (canMove) {
              if (canMove) {
                //render next section description or survey summary
                console.log("Can proceed to next section, checking if next section exists");

                Survey.calculateNextEligibleSections(surveyID, sectionId, function (result) {
                  //todo change check to see if array has any element we havent gone to
                  if (result === -1) {

                    Survey.updateCompletionStatus(surveyID, true, function (result) {
                      console.log(result);
                    });

                    console.log("No more section found with this id: " + typeof(sectionId));
                    helperMethods.constructScoreArray(server, surveyID, function (scores) {
                      return reply.view('summary', {
                        type: "summary",
                        title: Config.getAppTitle(),
                        score: scores,
                        userId: userId,
                        createdSurveyId: surveyID,
                        viewChartUrl: Config.SERVER_URL + "/surveylist?id=" + userId
                      });
                    });
                  } else {
                    //todo goto next available section in array
                    console.log(" Incrementing actual sectionId, as New section found with this id: " + result);
                    console.log("trying to get description of next section\n");
                    questionNum = 0;
                    var locales = new locale.Locales(request.headers["accept-language"], 'en');
                    return reply.view('descriptiontemplate_accessible', {
                      title: helperMethods.getLocaleResource(locales, Config.findDescriptionBySection(result).title),
                      text: helperMethods.getLocaleResource(locales, Config.findDescriptionBySection(result).text),
                      questionId: questionNum,
                      sectionId: result,
                      type: "description",
                      isDescription: true
                    });

                  }
                });

              } else {

                console.log("Cannot proceed to next section");
                //render next eligible question
                var question = helperMethods.getNextQuestionWithMaxInfo(userId, server, sectionId, surveyID, function (question) {
                  console.log("found next! question for above sectionID\n");
                  console.log(question);

                  var locales = new locale.Locales(request.headers["accept-language"], 'en');

                  return reply.view('questiontemplate', {
                    text: helperMethods.getLocaleResource(locales, question.text),
                    questionId: question.questionID,
                    sectionId: sectionId,
                    surveyId: surveyID,
                    replyOptions: question.response_options,
                    type: "question",
                    isDescription: false,
                    locales: locales,
                    getLocaleResource: helperMethods.getLocaleResource
                  });

                });
              }
            })

          });

        }


      }
    }
  });

  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);
  next();
};

exports.register.attributes = {
  name: 'survey',
  dependencies: 'visionary'
};
