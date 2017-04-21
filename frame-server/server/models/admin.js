'use strict';
const AdminGroup = require('./admin-group');
const Async = require('async');
const Joi = require('joi');
const MongoModels = require('mongo-models');


class Admin extends MongoModels {
  static create(name, callback) {

    const document = {
      name: name,
      //TODO, needs to be removed when clinicians have their own signup page without all these fields.
      yearOfInjury: 1910,
      gender: "female",
      siteNum: "12345",
      comments: '',
      tncAgreement: true,

      //patientIds and studyIds to be updated later
      patientIds: [],
      studyIds: [],
      timeCreated: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }

  static findByUsername(username, callback) {

    const query = { 'user.name': username };

    this.find(query, function(err, docs){

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);

    });
  }

  constructor(attrs) {

    super(attrs);

    Object.defineProperty(this, '_groups', {
      writable: true,
      enumerable: false
    });
  }

  isMemberOf(group) {

    if (!this.groups) {
      return false;
    }

    return this.groups.hasOwnProperty(group);
  }

  hydrateGroups(callback) {

    if (!this.groups) {
      this._groups = {};
      return callback(null, this._groups);
    }

    if (this._groups) {
      return callback(null, this._groups);
    }

    const tasks = {};

    Object.keys(this.groups).forEach((group) => {

      tasks[group] = function (done) {

        AdminGroup.findById(group, done);
      };
    });

    Async.auto(tasks, (err, results) => {

      if (err) {
        return callback(err);
      }

      this._groups = results;

      callback(null, this._groups);
    });
  }

  hasPermissionTo(permission, callback) {

    if (this.permissions && this.permissions.hasOwnProperty(permission)) {
      return callback(null, this.permissions[permission]);
    }

    this.hydrateGroups((err) => {

      if (err) {
        return callback(err);
      }

      let groupHasPermission = false;

      Object.keys(this._groups).forEach((group) => {

        if (this._groups[group].hasPermissionTo(permission)) {
          groupHasPermission = true;
        }
      });

      callback(null, groupHasPermission);
    });
  }
}


Admin.collection = 'admins';


Admin.schema = Joi.object().keys({
  _id: Joi.object(),
  user: Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().lowercase().required()
  }),
  yearOfInjury: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  gender: Joi.string().valid('male', 'female').required(),
  siteNum: Joi.number().integer().required(),
  comments: Joi.string().allow('').optional(),
  tncAgreement: Joi.boolean().required(),
  groups: Joi.object().description('{ groupId: name, ... }'),
  patientIds: Joi.array().items(Joi.string()),
  studyIds: Joi.array().items(Joi.string()),
  permissions: Joi.object().description('{ permission: boolean, ... }'),
  name: Joi.object().keys({
    first: Joi.string().required(),
    middle: Joi.string().allow(''),
    last: Joi.string().required()
  }),
  timeCreated: Joi.date()
});


Admin.indexes = [
  { key: { 'user.id': 1 } },
  { key: { 'user.name': 1 } }
];


module.exports = Admin;
