const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

class NotificationOfferEarned {

    async getData (externalId) {
        const offer = await dbClient.db(dbName).collection("feedback_answers").findOne({_id: new ObjectId(externalId)});
        return offer;
    }
}

module.exports = NotificationOfferEarned