const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;
const NotificationFactory = require('../../utils/Notification/notificationFactory')

const moment = require('moment'); // require

/* Queries */
const getMemberNotifications = async (root, args, context, info) => {
    const notifications = await dbClient.db(dbName)
        .collection("notifications")
        .find({ toUserType: "member", toUserId: new ObjectId(args.userId) })
        .toArray()

    console.log('Get Member Notifications ', notifications)

    for ( let notification of notifications ){
        const notificationObject = NotificationFactory.create(notification.type)
        const data = await notificationObject.getData(notification.externalId)

        console.log('Notification External Data ', data)

        notification.data = JSON.stringify(data)
        notification.fromNow = moment(notification.createdAt).fromNow()
    }

    return notifications;
}

/* Mutations */
const addNotification =  async (parent, args) => {
    try {

        console.log('Notification Requests ', args.data)

        let notification = {
            type: args.data.type,
            message: args.data.message,
            fromUserType: args.data.fromUserType,
            fromUserId: new ObjectId(args.data.fromUserId),
            toUserType: args.data.toUserType,
            toUserId: new ObjectId(args.data.toUserId),
            externalId: new ObjectId(args.data.externalId),
            read: args.data.read,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const _notification = await dbClient.db(dbName).collection('notifications').insertOne(notification);

        return _notification.insertedId.toString()
    } catch (e) {
        return e;
    }
}


module.exports = {
    queries: {
        getMemberNotifications
    },
    mutations: {
        addNotification
    }
}