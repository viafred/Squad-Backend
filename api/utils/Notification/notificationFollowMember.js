const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

class NotificationFollowMember {

    async getData (externalId) {
        const user = await dbClient.db(dbName).collection("users").findOne({_id: new ObjectId(externalId)});
        return user;
    }
}

module.exports = NotificationFollowMember