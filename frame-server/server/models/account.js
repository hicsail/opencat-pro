'use strict';
const Joi = require('joi');
var ObjectID = require('mongodb').ObjectID;
const MongoModels = require('mongo-models');
const NoteEntry = require('./note-entry');
const StatusEntry = require('./status-entry');


class Account extends MongoModels {
  static create(name, yearOfInjury, sitenum, comment, tncAgreement, lastPasswordChange, callback) {

    const document = {
      name: name,
      yearOfInjury: yearOfInjury,
      siteNum: sitenum,
      comments: comment,
      tncAgreement: tncAgreement,
      timeCreated: new Date(),
      lastPasswordChange: lastPasswordChange,
      //hash can be updated later when studies are created
      associatedStudyIds : [],

    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }

  static findByUsername(username, callback) {

    const query = { 'user.name': username.toLowerCase() };

    this.findOne(query, callback);
  }

  static findByAccountId(id, callback) {
    const query = {'_id': new ObjectID(id.toString())};

    console.log("Account query is:");
    console.log(query);
    Account.findOne(query, function(err,docs){
      callback(docs);
    });
  }
}


Account.collection = 'accounts';


Account.schema = Joi.object().keys({
  _id: Joi.object(),
  user: Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().lowercase().required()
  }),
  name: Joi.object().keys({
    first: Joi.string().required(),
    middle: Joi.string().allow(''),
    last: Joi.string().required()
  }),
  status: Joi.object().keys({
    current: StatusEntry.schema,
    log: Joi.array().items(StatusEntry.schema)
  }),
  notes: Joi.array().items(NoteEntry.schema),
  verification: Joi.object().keys({
    complete: Joi.boolean(),
    token: Joi.string()
  }),
  timeCreated: Joi.date(),
  firstName: Joi.string().lowercase().required(),
  middleName: Joi.string().lowercase().allow('').optional(),
  lastName: Joi.string().lowercase().required(),
  yearOfInjury: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  siteNum: Joi.number().integer().required(),
  comments: Joi.string().allow('').optional(),
  tncAgreement: Joi.boolean().required(),
  associatedStudyIds: Joi.array().items(Joi.string()),
  lastPasswordChange: Joi.date(),
  resetPassword: Joi.object().keys({token: Joi.string().required(), expires: Joi.date().iso().required()}),

});


Account.indexes = [
  { key: { 'user.id': 1 } },
  { key: { 'user.name': 1 } }
];


module.exports = Account;
