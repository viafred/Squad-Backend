const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

class NotificationOfferCreated {

    async getData (externalId) {
        const offer = await dbClient.db(dbName).collection("customer_feedback").findOne({_id: new ObjectId(externalId)});
        return offer;
    }
}

module.exports = NotificationOfferCreated