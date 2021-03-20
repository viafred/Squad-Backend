const { gql } = require('apollo-server');

const notificationResolvers = require('../resolvers/notification')

const typeDefs = gql`
    extend type Query {
        getMemberNotifications(userId: ID): [Notification]
    }
  
    type Notification {
        _id: ID
        type: String
        title: String
        message: String
        fromUserType: String
        fromUserId: ID
        toUserType: String
        toUserId: ID
        read: Boolean
        externalId:ID
        data: String
        createdAt: Date
        fromNow: String
    }
    
    input AddNotificationInput {
        type: String
        title: String
        message: String
        fromUserType: String
        fromUserId: ID
        toUserType: String
        toUserId: ID
        read: Boolean
        externalId:ID
    }
    
    extend type Mutation {
        addNotification(data: AddNotificationInput!): String
    }
`

const resolvers = {
    Query: {
        ...notificationResolvers.queries
    },

    Mutation: {
        ...notificationResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}