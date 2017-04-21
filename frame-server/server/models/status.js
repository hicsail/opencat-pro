'use strict';

const Joi = require('joi');
const Slug = require('slug');
const MongoModels = require('mongo-models');

class Status extends MongoModels{
  static create (pivot, name, callback) {

    const document = {
      _id: Slug(pivot + ' ' + name).toLowerCase(),
      pivot: pivot,
      name: name
    };

    this.insertOne(document, function (err, docs) {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  };
}

Status.collection = 'statuses';

Status.schema = Joi.object().keys({
  _id: Joi.string(),
  pivot: Joi.string().required(),
  name: Joi.string().required()
});


Status.indexes = [
  {key: {pivot: 1}},
  {key: {name: 1}}
];

module.exports = Status;
