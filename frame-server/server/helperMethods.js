'use strict';

const Locale = require('locale');

const Config = require('./config/config.js');
const Algorithm = require('./profile/lib/algorithm.js');
const RuleEngine = require('./profile/lib/businessRules.js');
const Calibrations = require('./profile/responseCalibrations.json');

var helperMethods = {};

(function () {

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

  helperMethods.getUnAnsweredQuestions = function (userid, server, sectionId, surveyId, callbackToExecute) {

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

      RuleEngine.getDemographicFilterQuery(server, userid, surveyId, function (result) {
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
            callbackToExecute(unAnsweredQuestions);
          });

        }

      });
    });

  };

  /*Method to check if the survey can move to the next section or not */
  helperMethods.canMoveToNextSection = function (userId, server, sectionId, surveyId, callback) {
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
            if ((numAnswered.length > Config.sectionSkipUpperLimit) || (numAnswered.length >= Config.sectionSkipLowerLimit && (result && result.score[sectionId].stdError < Config.sectionSkipScoreThreshold) )) {
              console.log("CAN MOVE");
              return callback(true);
            }
            else {
              console.log("CANNOT MOVE");
              return callback(false);

            }

          });
        });
      }
    })
  };

  /*Returns json having next eligible question, or an empty json if none is found*/

  helperMethods.getNextQuestionWithMaxInfo = function (userid, server, sectionId, surveyId, callback) {
    var numUnAnswered = [], itemCalibration = [];
    var maxInfo = Config.maxInfoParameter;
    var nextQuestion = {};
    //for all unanswered questions, store slope.
    //store map of <category,calibration> of each in a 2-D array
    //itemCalibration, itemSlope,  matched with itemCategory

    console.log("fetching next question");

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

        //get next unanswered question, can modify for different algorithm
        nextQuestion = numUnAnswered[0];

        //return the next eligible chosen question
        callback(nextQuestion);

      });

    });
  };

  helperMethods.load_response = function (server, sectionId, surveyId, callback) {
    const Score = server.plugins['hapi-mongo-models'].Score;
    //itemCalibration, itemSlope,  matched with itemCategory
    //create a score record if not already present because we save score irrespective of whether questions are answered or skipped

    Score.findBySurveyID(surveyId, function (result) {
      if (!result) {
        console.log("No Score tuple found, making a new one.....");
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

  helperMethods.updateScores = function (server, surveyId, sectionId, callback) {
    const Response = server.plugins['hapi-mongo-models'].Response;
    const Score = server.plugins['hapi-mongo-models'].Score;

    Response.fetchQuestionAndAnswerData(surveyId, sectionId, function (results) {

      //Questions here can be all answered, some skipped some answered and all skipped.
      //                           result >=1 result >=1                  result =0

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
            if ((Calibrations[i].item == qId) && (Calibrations[i].scales == sectionId)) {
              //we found the current question, now store calibration
              itemCalibration[itemCalibration.length - 1][Calibrations[i].category] = Calibrations[i].calibration;
            }
          }

          //now attach aggregated Question data
          itemSlope.push(element.question_data[0].slope);
          itemCategory.push(element.question_data[0].category);



        });

        //Now update Score Tuple and call back

        //TODO needs to be customized as per need
        Algorithm.calculateScore(function (out) {
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

  helperMethods.constructScoreArray = function (server, surveyId, callback) {
    const Score = server.plugins['hapi-mongo-models'].Score;
    var temp = [], stdErr, currentScore;

    Score.findBySurveyID(surveyId, function (result) {
      if (result && result.length != 0) {
        //If database has scores, populate the same into an object that the client can use to render
        Object.keys(result.score).forEach(function (key) {
          var scoreObj = {};
          scoreObj["section"] = Config.findDescriptionBySection(key).title;
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

  helperMethods.constructAvailableSectionArray = function (server, userData, callback) {

    RuleEngine.constructAvailableSectionArray(server, userData, function(result){
      callback(result);
    })
  };

  helperMethods.constructAndStoreUserTags = function (server, userid, userData) {
    const UserData = server.plugins['hapi-mongo-models'].UserData;

    //Custom project-defined rule engine calculation, to be saved as part of user data
    RuleEngine.setProfileVariables(server, userid,   function (profileData) {
      //Also create the userdata record in background.

      console.log("profile data found is:");
      console.log(profileData);

      UserData.create(userid, userData, profileData, function (err, data) {
        if (err) {
          return reply(err);
        }
        console.log("UserData saved sucessfully as"+ data);
        //do nothing else
      });

    });

  };

  /**
   * This function returns all scores for the user to the webpage to construct the
   * chart through the passed in callback function
   */
  helperMethods.getAllScores = function (server, obj, callback, replyObj) {
    const Score = server.plugins['hapi-mongo-models'].Score;

    var surveyIdArr = obj['score_arr'];
    var surveyUpdateArr = obj['update_arr'];
    var r = [];
    Score.findBySurveyIDs(surveyIdArr, function (result) {
      if (result && result.length != 0) {
        //If database has scores, populate the same into an object that the client can use to render
        // construct the object here before returning to the page

        for (var i = 0; i < result.length; i++) {
          var obj = {};
          var id = result[i]['_id'];

          var sectionNames = [];
          var sectionScores = [];
          var p = result[i].score;
          for (var key in p) {
            if (p.hasOwnProperty(key)) {
              console.log(key + " -> " + p[key]);
              sectionNames.push(Config.findDescriptionBySection(key).title);
              sectionScores.push((parseFloat(p[key].currentScore) * 10 + 50).toFixed(2));
            }
          }
          obj["sectionNames"] = sectionNames;
          obj["sectionScore"] = sectionScores;
          var timestamp = parseInt(id.toString().substr(0, 8), 16) * 1000
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
  };

  /**
   *   Create a function to get all of surveys by querying the scores by user ID.
   *   Model after the function above.
   *   This function calls getAllScoresForUser above and passes in the callback that
   *   renders the survey and the array of surveyIds for the particular user.
   *
   *   callback1 is the call to getAllScores function. callback2 is the return to the webpage function.
   *
   */
  helperMethods.constructSurveyIdArray = function (server, userId, callback1, callback2, replyObj) {
    const Survey = server.plugins['hapi-mongo-models'].Survey;

    Survey.findByUserID(userId, function (result) {
      if (result && result.length != 0) {
        //If database has scores, populate the same into an object that the client can use to render
        console.log("The resulting database call to get user's surveys contains " + result.length + " values.");
        var arrWithScores = [];
        var arrWithUpdates = [];
        var obj = {};
        obj['user_id'] = userId;
        for (var i = 0; i < result.length; i++) {
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

  helperMethods.generateScoreObject = function (dbModel, time) {
    var obj = {};
    var sectionNames = [];
    var sectionScores = [];
    var p = dbModel.score;
    for (var key in p) {
      if (p.hasOwnProperty(key)) {
        sectionNames.push(Config.findDescriptionBySection(key).title);
        sectionScores.push((parseFloat(p[key].currentScore) * 10 + 50).toFixed(2));
      }
    }
    obj["sectionNames"] = sectionNames;
    obj["sectionScore"] = sectionScores;
    obj["lastUpdated"] = time;
    obj["surveyId"] = dbModel.surveyId;
    return obj;
  }

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

  /**
   * Given a Locale object, finds the best matching string from a object
   * containing a locale to string map. For backwards compatibility a 
   * string is accepted in place of a map. In this case the string is
   * simply returned.
   *  
   * @param {*} browserLocales A Locale object containing the locales
   *    supported by the browser. Generally determined from the
   *    "Accept-Language" header of the HTTP request.
   * @param {*} source A string, array or javascript object. 
   * 
   * @returns A string or array in the desired locale or the default locale. If the
   *          source parameter is a string a string it is returned regardless
   *          of the locale specified for backwards compatibility. 
   */
  helperMethods.getLocaleResource = function (browserLocales, source) {
    var result = "";

    if (typeof source === 'string' || source instanceof String) {
      result = source;
    }
    else if (typeof source === 'array' || source instanceof Array) {
      result = source;
    }
    else {
      // locale available in the 'source' parameter object.
      var supportedLocales = new Locale.Locales(Object.keys(source));
      var bestLocale = browserLocales.best(supportedLocales);

      if (bestLocale.defaulted) {
        result = source[bestLocale.language];
      }
      else {
        result = source[bestLocale.normalized];
      }
    }

    return result;
  };

})();
module.exports = helperMethods;
