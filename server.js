require('events').EventEmitter.defaultMaxListeners = Infinity
const logger = require('./logger');

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const { ApolloServer } = require('apollo-server-express');

const { dbClient } = require('./api/config/mongo');

const app = express();
const cors = require('cors');

const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./api/config/service-account.json'); /*-> This refers to the google cloud service account, [Learn How to Get it From](https://firebase.google.com/docs/admin/setup)*/

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://squad-b2c2b.firebaseio.com/"
});

const database = firebaseAdmin.firestore();
const settings = {timestampsInSnapshots: true};
database.settings(settings);


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

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(logger.pre);

const server = new ApolloServer({
    modules: [
        require('./api/graphql/modules/user'),
        require('./api/graphql/modules/customer'),
        require('./api/graphql/modules/brand'),
        require('./api/graphql/modules/category'),
        require('./api/graphql/modules/uploadPhoto'),
        require('./api/graphql/modules/product'),
        require('./api/graphql/modules/compensation'),
        require('./api/graphql/modules/notification')
    ]
});

server.applyMiddleware({ app, path: '/api/graphql' });

app.listen({ port: process.env.PORT }, () => {
    dbClient.connect().then((client) => { console.log('Apollo Server on http://localhost:8000/api/graphql'); console.log('MongoDB Connected'); }).catch(err => { console.log(err) });
});