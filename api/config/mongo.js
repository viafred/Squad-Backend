'use strict';

const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://squad:squad123@cluster0-cimt2.mongodb.net/test?retryWrites=true&w=majority";
const dbClient = new MongoClient(uri, { useNewUrlParser: true,  useUnifiedTopology: true });

const dbName = process.env.DB_NAME;

module.exports.dbClient = dbClient;
module.exports.dbName = dbName;