const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const firebaseAdmin = require('firebase-admin');
const graphlHttp = require('express-graphql');
const serviceAccount = require('./api/config/service-account.json'); /*-> This refers to the google cloud service account, [Learn How to Get it From](https://firebase.google.com/docs/admin/setup)*/
const bodyParser = require('body-parser')

const GraphQL = require('graphql')
const { GraphQLObjectType, GraphQLSchema } = GraphQL

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://squad-b2c2b.firebaseio.com/"
});

const mutationFields = require('./api/graphql/mutations')
const queryFields = require('./api/graphql/queries')

/*
  The above code initializes firebase-admin globally
*/
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    if (req.method === "OPTIONS") {
        res.header('Access-Control-Allow-Methods', 'POST,GET');
        return res.status(200).json({});
    }
    next();
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            ...queryFields
        }
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
            ...mutationFields
        }
    })
});

app.use('/api/v1/graphql', graphlHttp({
    schema: schema, //Fetches our graphql Schema
    graphiql: true // Gives us a user interface
}));

app.use('/favicon.ico', (req, res, next) => {
    console.log('Handling route error0')
    next()
});

app.use((req, res, next) => {
    const error = new Error('Route Not Found');
    error.status = 404;
    next(error);
    return res.status(404).send({
        message: 'Route Not Found'
    })
});

app.use((err, req, res) => {
    res.status(err.status || 500);
    res.json({
        err: {
            message: err.message
        }
    })
});

module.exports = app;