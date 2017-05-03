'use strict';

const Config = require('./config/config.js');
const Algorithm = require('./profile/lib/algorithm.js');
const Calibrations = require('./profile/responseCalibrations.json');
var helperMethods = {};

(function () {

  /**
   * This function returns answered questions for a particular section of a survey.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function to pass the answered questions to.
   * @returns {Object[]} An array of the answered questions, each one represented as a JS Object. This is passed to the callback parameter.
   */
  helperMethods.getAnsweredQuestions = function (server, sectionId, surveyId, callback) {

    const Response = server.plugins['hapi-mongo-models'].Response;
    //itemCalibration, itemSlope,  matched with itemCategory
    var answeredQuestions = [];

    //STEP1 Get all answered Questions for this section of the survey(skipped false, choice id not empty)
    const filter = {
      survey_id: surveyId,
      domain_id: sectionId,
      choice_id: {$ne: ""},
      skip: false
    };

    Response.find(filter, function (err, response) {
      if (err) {
        console.log("error in Response find");
        console.log(err);
        return reply(err);
      }
      answeredQuestions = response;
      callback(answeredQuestions);
    });
  };

  /**
   * This function returns the question set to a survey in progess
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callbacktoExecute ???
   * @param {function} callback The callback function to pass the question set to.
   * @returns {Object[]} An array of question objects, which represents the question set. This is passed to the callback parameter.
   */
  helperMethods.getVisitedQuestionSet = function (server, sectionId, surveyId, callbacktoExecute, callback) {

    //Visited Questionare those that have either been answered or skipped
    const Response = server.plugins['hapi-mongo-models'].Response;
    //itemCalibration, itemSlope,  matched with itemCategory
    var answeredQuestions = [];
    //STEP1 Get all answered Questions for this section of the survey
    const filter1 = {
      survey_id: surveyId,
      domain_id: sectionId,
      choice_id: {$ne: ""}
    };

    const filter2 = {
      survey_id: surveyId,
      domain_id: sectionId,
      skip: true
    };

    Response.aggregate([
      {
        $lookup: {
          from: "Question",
          localField: "question_id",
          foreignField: "questionID",
          as: "question_data"
        }
      }, {
        $match: {$or: [filter1, filter2]}
      }

    ], function (err, response) {
      if (err) {
        console.log("error in Response find");
        console.log(err);
        return reply(err);
      }
      answeredQuestions = response;
      callback(answeredQuestions, callbacktoExecute);
    });
  };

  /**
   * This function calculates the scores for any available survey sections and saves them.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function to pass the saved scores to.
   * @returns {Object[]} An array of question objects with calculated scores. This is passed to the callback parameter.
   */
  helperMethods.calculateAndSaveAvailableSections = function (server, sectionId, surveyId, callback) {

    //itemCalibration, itemSlope,  matched with itemCategory
    var answeredQuestions = [];

    //STEP1 Get all answered Questions for this section of the survey
    const filter = {
      survey_id: surveyId,
      domain_id: sectionId,
      choice_id: {$ne: ""}
    };

    const Response = server.plugins['hapi-mongo-models'].Response;
    Response.find(filter, {question_id: 1}, (err, response) => {
      if (err) {
        console.log("error in Response find");
        console.log(err);
        return reply(err);
      }
      answeredQuestions = response;
      callback(answeredQuestions);
    });
  };

  /**
   * This function returns the unanswered questions of a survey in progress.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function to pass the questions to.
   * @returns {Object[]} An array of question objects, all of which are unanswered. This is passed to the callback parameter.
   */
  helperMethods.getUnAnsweredQuestions = function (userid, server, sectionId, surveyId, callback) {

    const Response = server.plugins['hapi-mongo-models'].Response;
    const Question = server.plugins['hapi-mongo-models'].Question;
    const UserData = server.plugins['hapi-mongo-models'].UserData;
    //itemCalibration, itemSlope,  matched with itemCategory
    var answeredQuestions = [];

    Response.findBySurveyIDAndSectionID(surveyId, sectionId, function (result) {
      answeredQuestions = result;

      var unAnsweredQuestions = [];
      var ids = answeredQuestions.map(function (question) {
        return question.question_id;
      });

      // STEP1 Get all questions NOT IN answered Questions and that match this survey's demographic criteria
      UserData.getDemographicFilterQuery(userid, surveyId, function (result) {
        if (result) {

          var filter = result;
          filter["questionID"] = {$nin: ids};
          filter["sectionID"] = sectionId;

          Question.findUnansweredQuestions(filter, function (err, response) {
            if (err) {
              console.log("error in Response find");
              console.log(err);
              return reply(err);
            }

            unAnsweredQuestions = response;
            callback(unAnsweredQuestions);
          });

        }

      });
    });

  };

  /**
   * This function checks whether the survey can move on to the next section.
   * @param {string} userId The ID of the current user.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function to pass the result to.
   * @returns {boolean} Represents whether the survey can move on. This is passed to the callback parameter.
   */
  helperMethods.canMoveToNextSection = function (userId, server, sectionId, surveyId, callback) {
    console.log("canmove");
    const Score = server.plugins['hapi-mongo-models'].Score;

    //If unanswered for this section returns [], means this section is completely answered, return true straightaway
    helperMethods.getUnAnsweredQuestions(userId, server, sectionId, surveyId, function (result) {
      if (result.length == 0) {
        console.log("All answered for this section");
        return callback(true);
      } else {
        var numAnswered = [];
        helperMethods.getAnsweredQuestions(server, sectionId, surveyId, function (result) {
          numAnswered = result;

          Score.findBySurveyID(surveyId, function (result) {
            if ((numAnswered.length  > 14) || (numAnswered.length >= 8 && (result && result.score[sectionId].stdError < 0.32) )) {
              console.log("CAN MOVE");
              return callback(true);
            }
            else{
              console.log("CANNOT MOVE");
              return callback(false);

            }

          });
        });
      }
    })
  };

  /**
   * This function returns the next eligible question, or an empty JSON object if none is found.
   * @param {string} userid The ID of the current user.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function to pass the question to.
   * @returns {Object} A question object. This is passed to the callback parameter.
   */
  helperMethods.getNextQuestionWithMaxInfo = function (userid, server, sectionId, surveyId, callback) {
    var numUnAnswered = [], itemCalibration = [];
    var maxInfo = -100;
    var nextQuestion = {};
    //for all unanswered questions, store slope.
    //store map of <category,calibration> of each in a 2-D array
    //itemCalibration, itemSlope,  matched with itemCategory

    console.log("get next question..........");

    //STEP1 Get all answered Questions for this section of the survey
    helperMethods.getUnAnsweredQuestions(userid, server, sectionId, surveyId, function (result) {
      const Score = server.plugins['hapi-mongo-models'].Score;

      var itemCategory = [];
      var itemSlope = [];
      numUnAnswered = result;

      //STEP 2.Store calibration, slope and category
      //Calculate info score for this question.
      Score.findBySurveyID(surveyId, function (result) {
        for (var j = 0; j < numUnAnswered.length; j++) {
          var qId = numUnAnswered[j].questionID;
          itemCategory.push(numUnAnswered[j].category);
          itemSlope.push(parseFloat(numUnAnswered[j].slope));

          //Store all caliberations for that question
          itemCalibration.push(new Array(4));
          for (var i = 0; i < Calibrations.length; i++) {
            if (Calibrations[i].item == qId && Calibrations[i].scales == sectionId) {
              //we found the current question, now store calibration
              itemCalibration[itemCalibration.length - 1][Calibrations[i].category] = Calibrations[i].calibration;
            }

          }
        }
        for (var j = 0; j < numUnAnswered.length; j++) {
          //Now calculate info for each
          var info = -1* Algorithm.L21(parseFloat(result.score[sectionId].currentScore), [itemCalibration[j]], [itemSlope[j]], [itemCategory[j]]);
          if (maxInfo < info) {

            maxInfo = info;
            //This is next eligible question
            nextQuestion = numUnAnswered[j];
          }

        }

        //return the next eligible chosen question
        callback(nextQuestion);

      });

    });
  };

  /**
   * This function returns all patients and the number of existing surveys.
   * @param {Object} server The current server instance.
   * @param {function} callback The callback function to pass the result to.
   * @returns {Object[]} An array of user objects. This is passed to the callback parameter.
   * @returns {number} A count of all existing surveys. This is passed to the callback parameter.
   */
  helperMethods.getPatientData = function (server,callback) {
    const User = server.plugins['hapi-mongo-models'].User;
    const Survey = server.plugins['hapi-mongo-models'].Survey;
    User.find({}, function(err, result){
      Survey.count(function (err,count) {
        callback(result,count);

      })
    });
  };

  /**
   * This function calls helperMethods.updateScores after checking if a score exists for a survey section. If one doesn't exist, it will create one, and still call helperMethods.updateScores.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function that is passed to helperMethods.updateScores.
   */
  helperMethods.load_response = function (server, sectionId, surveyId, callback) {
    const Score = server.plugins['hapi-mongo-models'].Score;
    //itemCalibration, itemSlope,  matched with itemCategory
    //create a score record if not already present because we save score irrespective of whether questions are answered or skipped

    Score.findBySurveyID(surveyId, function (result) {
      if (!result) {
        Score.create(surveyId, sectionId, {}, function () {
          //Now update based on condition
          helperMethods.updateScores(server, surveyId, sectionId, callback);
        });
      } else {
        console.log("Score record already exists, updating.....");
        helperMethods.updateScores(server, surveyId, sectionId, callback);
      }
    });
  };

  /**
   * This function updates the scores of a survey section and runs a callback function.
   * @param {Object} server The current server instance.
   * @param {string} sectionId The ID of the desired section.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function that is run.
   */
  helperMethods.updateScores = function (server, surveyId, sectionId, callback) {
    const Response = server.plugins['hapi-mongo-models'].Response;
    const Score = server.plugins['hapi-mongo-models'].Score;

    Response.fetchQuestionAndAnswerData(surveyId, sectionId, function (results) {

      //Questions here can be all answered, some skipped some answered and all skipped.
      if (results && results.length == 0) {
        //All skipped till here, add a default score for moving ahead
        //VB code follows same pattern

        //keep the score values 0,1
        var score = {currentScore: 0, stdError: 1};
        Score.updateScoreForSection(surveyId, sectionId, score, function () {
          return callback();
        });

      } else {
        //do score calculation here
        //1.Construct all arrays
        var itemCalibration = new Array(), itemAnswer = new Array(), itemSlope = new Array(), itemCategory = new Array();
        results.forEach(function (element, index) {
          var choiceId = element.choice_id;
          var qId = element.question_id;
          //store response
          itemAnswer[index] = choiceId;

          itemCalibration.push(new Array(4));
          //Store all calibrations for that question
          //find that qid and sid in response json and store all weights

          for (var i = 0; i < Calibrations.length; i++) {
            if( (Calibrations[i].item == qId) && (Calibrations[i].scales == sectionId)) {
              //we found the current question, now store calibration
              itemCalibration[itemCalibration.length - 1][Calibrations[i].category] = Calibrations[i].calibration;
            }
          }

          //now attach aggregated Question data
          itemSlope.push(element.question_data[0].slope);
          itemCategory.push(element.question_data[0].category);

        });

        //Now update Score Tuple and call back

        Algorithm.wmlGrm(itemCalibration, itemSlope, itemCategory, itemAnswer, function (out) {

          //do later for display
          var score = {currentScore: out[0], stdError: out[1]};
          console.log("Score at this step is:");
          console.log(score);
          //Update Map of survey score for this section
          Score.updateScoreForSection(surveyId, sectionId, score, function () {
            return callback();
          });
        });
      }

    });
  };

  /**
   * This function contructs an array of scores for all sections of a particular survey.
   * @param {Object} server The current server instance.
   * @param {string} surveyId The ID of the desired survey.
   * @param {function} callback The callback function to pass the score array to.
   * @returns {Object[]} An array of score objects. This is passed to the callback parameter.
   */
  helperMethods.constructScoreArray = function (server, surveyId, callback) {
    const Score = server.plugins['hapi-mongo-models'].Score;
    var temp = [], stdErr, currentScore;

    Score.findBySurveyID(surveyId, function (result) {
      if (result && result.length != 0) {
        //If database has scores, populate the same into an object that the client can use to render
        Object.keys(result.score).forEach(function (key) {
          var scoreObj = {};
          scoreObj["section"] = Config.findDescriptionBySection(Config.descriptionList, key).title;
          scoreObj["stdErr"] = (result.score[key].stdError * 10).toFixed(2);
          scoreObj["currentScore"] = (result.score[key].currentScore * 10 + 50).toFixed(2);
          temp.push(scoreObj);
        });
      }
      console.log("Rendering thank you template, here is scores object");
      console.log(temp);
      callback(temp);

    })
  };

  /**
   * This function updates a survey with available sections.
   * @param {Object} server The current server instance.
   * @param {string} surveyId The ID of the desired survey.
   * @param {string} doesWalk Whether the user walks.
   * @param {string} usesMWC Whether the user has a manual wheelchair.
   * @param {string} usesPWC Whether the user has a powered wheelchair.
   * @param {function} callback The callback function to pass the result to.
   * @returns {Object} The specified survey with available sections. This is passed to the callback parameter.
   */
  helperMethods.constructAvailableSectionArray = function (server, surveyId, doesWalk, usesMWC, usesPWC, callback) {
    var Survey = server.plugins['hapi-mongo-models'].Survey;
    var temp = [];
    if (doesWalk === "true") {
      temp.push(4);
    }
    //common sections to be displayed in all cases
    temp.push(5, 6, 7);
    if (usesMWC === "true") {
      temp.push(8);
    }
    if (usesPWC === "true") {
      temp.push(9);
    }

    console.log("Available Sections are:");
    console.log(temp);

    Survey.updateAvailableSections(surveyId, temp, function (result) {
      //return only after db operation is successful
      callback(result);
    })
  };

  /**
   * This function creates property tags for a user and stores them in a UserData record.
   * @param {Object} server The current server instance.
   * @param {string} surveyId The ID of the desired survey.
   * @param {string} userid The ID of the current user.
   * @param {string} canWalk Whether the user walks.
   * @param {string} married Whether the user is married.
   * @param {string} usesMWC Whether the user has a manual wheelchair.
   * @param {string} usesPWC Whether the user has a powered wheelchair.
   * @param {string} bladder Whether the user ???
   * @param {string} living Whether the user ???
   * @param {string} para Whether the user ???
   */
  helperMethods.constructAndStoreUserTags = function (server, surveyid, userid, canWalk, married, usesMWC, usesPWC, bladder, living, para) {
    const UserData = server.plugins['hapi-mongo-models'].UserData;
    const User = server.plugins['hapi-mongo-models'].User;

    //Prepare tags
    User.findByUserId(userid, function (user) {
      var g1_1, g1_2, g2_1, g2_2, g4_1, g4_2, g6_1, g6_2, g7_1, g7_2, g8_1, g8_2, g9_1, g9_2, g11_1, g11_2, g12_1, g12_2, g13_1, g13_2;
      console.log(user.gender);

      g1_1 = user.gender === "male" ? 1 : 0;
      g1_2 = user.gender === "male" ? 0 : 1;

      g2_1 = user.gender === "male" ? 0 : 1;
      g2_2 = user.gender === "male" ? 1 : 0;

      g4_1 = canWalk === "true" ? 1 : 0;
      g4_2 = canWalk === "true" ? 0 : 1;

      g6_1 = usesMWC === "true" ? 1 : 0;
      g6_2 = usesMWC === "true" ? 0 : 1;

      g7_1 = usesPWC === "true" ? 1 : 0;
      g7_2 = usesPWC === "true" ? 0 : 1;

      g8_1 = married === "true" ? 1 : 0;
      g8_2 = married === "true" ? 0 : 1;

      g9_1 = bladder === "true" ? 1 : 0;
      g9_2 = bladder === "true" ? 0 : 1;

      g11_1 = living === "true" ? 1 : 0;
      g11_2 = living === "true" ? 0 : 1;

      g12_1 = para === "true" ? 1 : 0;
      g12_2 = para === "true" ? 0 : 1;

      g13_1 = para === "true" ? 1 : 0;
      g13_2 = para === "true" ? 0 : 1;

      //Also create the userdata record in background.
      UserData.create(surveyid, canWalk, userid, married, usesMWC, usesPWC, living, bladder, para, g1_1, g1_2, g2_1, g2_2, g4_1, g4_2, g6_1, g6_2, g7_1, g7_2, g8_1, g8_2, g9_1, g9_2, g11_1, g11_2, g12_1, g12_2, g13_1, g13_2, function (err, userData) {
        if (err) {
          return reply(err);
        }
        //do nothing else
      });

    });

  };

  /**
   * This function retrieves all scores for the surveys specified.
   * @params {Object} server The current server instance.
   * @params {Object} obj An object containing the surveys to retrieve scores for.
   * @params {function} callback The callback function, should return data to the web view.
   * @params {Object} replyObj ???
   */
  helperMethods.getAllScores = function(server, obj, callback, replyObj) {
    const Score = server.plugins['hapi-mongo-models'].Score;

    Config.initDescriptionList(Config.descriptionList);
    var surveyIdArr = obj['score_arr'];
    var surveyUpdateArr = obj['update_arr'];
    var r = [];
    Score.findBySurveyIDs( surveyIdArr, function(result) {
      if (result && result.length != 0) {
        //If database has scores, populate the same into an object that the client can use to render
        // construct the object here before returning to the page

        for(var i = 0; i < result.length; i++){
          var obj = {};
          var id = result[i]['_id'];

          var sectionNames = [];
          var sectionScores = [];
          var p= result[i].score;
          for (var key in p) {
            if (p.hasOwnProperty(key)) {
              console.log(key + " -> " + p[key]);
              sectionNames.push(Config.findDescriptionBySection(Config.descriptionList,key).title);
              sectionScores.push((parseFloat(p[key].currentScore)* 10 + 50).toFixed(2));
            }
          }
          obj["sectionNames"] = sectionNames;
          obj["sectionScore"] = sectionScores;
          var timestamp = parseInt(id.toString().substr(0,8), 16)*1000
          var date = new Date(timestamp);
          obj["lastUpdated"] = surveyUpdateArr[i];
          obj["surveyId"] = result[i].surveyId;
          // obj["score"] = result[i]["score"];
          r.push(obj);
        }
        console.log("chart data is");
        console.log(r);
        callback(r, replyObj);
      }
    });
  }

  /**
   * This function retrieves all surveys for the specified user.
   * @params {Object} server The current server instance.
   * @params {string} userId The desired user ID.
   * @params {function} callback1 The first callback, should be to helperMethods.getAllScores.
   * @params {function} callback2 The second callback, should be to return data to the web view.
   * @params {Object} replyObj ???
   */
  helperMethods.constructSurveyIdArray = function(server, userId, callback1,  callback2, replyObj) {
    const Survey = server.plugins['hapi-mongo-models'].Survey;

    Survey.findByUserID(userId, function(result) {
      if (result && result.length != 0) {
        //If database has scores, populate the same into an object that the client can use to render
        console.log("The resulting database call to get user's surveys contains " + result.length + " values.");
        var arrWithScores = [];
        var arrWithUpdates = [];
        var obj = {};
        obj['user_id'] = userId;
        for(var i = 0; i< result.length; i++){
          var surveyId = result[i]['_id'];
          var surveyUpdated = result[i]["lastUpdated"];
          arrWithScores.push(surveyId.toString());
          arrWithUpdates.push(surveyUpdated.toISOString());
        }
        obj['score_arr'] = arrWithScores;
        obj['update_arr'] = arrWithUpdates;
        // callback is the getAllScores function
        callback1(server, obj, callback2, replyObj);
      }

    })
  }

  /**
   * This function generates a Score object.
   * @params {Object} dbModel ???
   * @params {Date} time The current time.
   */
  helperMethods.generateScoreObject = function (dbModel, time) {
    var obj = {};
    var sectionNames = [];
    var sectionScores = [];
    var p = dbModel.score;
    for (var key in p) {
      if (p.hasOwnProperty(key)) {
        sectionNames.push(Config.findDescriptionBySection(Config.descriptionList,key).title);
        sectionScores.push((parseFloat(p[key].currentScore)* 10 + 50).toFixed(2));
      }
    }
    obj["sectionNames"] = sectionNames;
    obj["sectionScore"] = sectionScores;
    obj["lastUpdated"] = time;
    obj["surveyId"] = dbModel.surveyId;
    return obj;
  };

  /**
   * This function retrieves all the active studies a user is part of.
   * @params {Object} server The current server instance.
   * @params {string} userId The desired user ID.
   * @params {function} callback The callback function to pass the active studies to.
   */
  helperMethods.getActiveStudies = function (server, userId, callback) {
    const Study = server.plugins['hapi-mongo-models'].Study;
    const StudySignup = server.plugins['hapi-mongo-models'].StudySignup;
    var acceptedStudies = [];

    StudySignup.findAcceptedStudies(userId, function(results) {

      for(var i = 0; i < results.length; i++) {
        acceptedStudies.push(results[i].studyId);
      }

      Study.findActiveStudies(acceptedStudies, function(accepted) {
        return callback(accepted);
      });
    });
  };

})();
module.exports = helperMethods;
