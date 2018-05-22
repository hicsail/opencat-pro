/*User Specific Routes- Login, Register etc.*/


'use strict';
const internals = {};

const locale = require('locale');

var Config = require("../config/config.js");
const helperMethods = require('../helperMethods.js'); //http://stackoverflow.com/questions/5726729/how-to-parse-json-using-node-js
const homeJSON = require(Config.getProfilePath() + "/homepage_text.json");
const contactJSON = require(Config.getProfilePath() + "/contact_info.json");
let logoName =  "logo.png";

internals.applyRoutes = function (server, next) {

  server.route({
    method: "GET",
    path: "/public/{param*}",
    handler: {
      directory: {
        path: "./server/web/public",
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      var locales = new locale.Locales(request.headers["accept-language"], 'en');

      let majorText = helperMethods.getLocaleResource(locales, homeJSON["major_text"]);
      let instructions = helperMethods.getLocaleResource(locales, homeJSON["instructions"]);
      let minorText = helperMethods.getLocaleResource(locales, homeJSON["minor_text"]);

      if (request.auth.isAuthenticated) {
        const userID = request.auth.credentials.user._id;
        helperMethods.getActiveStudies(server, userID, function (result) {
          let isAccount = request.auth.credentials.user.roles.account ? true : false;
          return reply.view('home_accessible', {
            title: Config.getAppTitle(),
            configUrl: Config.SERVER_URL,
            loggedIn: true,
            majorText: majorText,
            minorText: minorText,
            logoname: logoName,
            favicon: "logo.png",
            instructions: instructions,
            name: isAccount ? request.auth.credentials.user.roles.account.name : request.auth.credentials.user.roles.admin.name,
            studies: result
          });
        });
      } else {
        return reply.view('home_accessible', {
          title: Config.getAppTitle(), configUrl: Config.SERVER_URL, loggedIn: false,
          majorText: majorText,
          minorText: minorText,
          logoname: logoName,
          favicon: "logo.png",
          instructions: instructions,
          name: ''
        });
      }

    }
  });

  server.route({
    method: "GET",
    path: "/login",
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      }

      return reply.view('login_accessible', {
        title: Config.getAppTitle(),
        configUrl: Config.SERVER_URL,
        favicon: "logo.png",
        logoname : logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/register",
    handler: function (request, reply) {
      return reply.view('register_accessible', {
        title: Config.getAppTitle(),
        configUrl: Config.SERVER_URL,
        favicon: "logo.png",
        logoname : logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/forgot",
    handler: function (request, reply) {
      return reply.view('forgot_accessible', {
        title: Config.getAppTitle(),
        favicon: "logo.png",
        configUrl: Config.SERVER_URL,
        logoname : logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/contact",
    handler: function (request, reply) {

      let officePhone = contactJSON["office_phone"];
      let directPhone = contactJSON["direct_phone"];
      let email = contactJSON["email"];
      return reply.view('contact_accessible', {
        title: Config.getAppTitle(),
        officePhone: officePhone,
        directPhone: directPhone,
        email: email,
        favicon: "logo.png",
        configUrl: Config.SERVER_URL,
        logoname : logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/reset",
    handler: function (request, reply) {
      return reply.view('reset_accessible', {
        title: Config.getAppTitle(),
        favicon: "logo.png",
        configUrl: Config.SERVER_URL,
        logoname : logoName
      });
    }
  });

  server.route({
    method: "GET",
    path: "/surveylist",
    handler: function (request, reply) {
      return reply.view('userSurveyDetailsCharts', {
        title: Config.getAppTitle(),
        favicon: "logo.png",
        logoname : logoName,
        configUrl: Config.SERVER_URL,
        userid: (request.query['id'] || "")
      });
    }
  });

  server.route({
    method: "GET",
    path: "/invite",
    handler: function (request, reply) {
      return reply.view('invite_accessible', {
        title: Config.getAppTitle(),
        configUrl: Config.SERVER_URL,
        favicon: "logo.png",
        logoname : logoName
      });
    }
  });

  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);
  next();
};

exports.register.attributes = {
  name: 'userReg',
  dependencies: 'visionary'
};
