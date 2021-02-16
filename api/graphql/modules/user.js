const { gql } = require('apollo-server');

const userResolvers = require('../resolvers/user')

const typeDefs = gql`
    extend type Query {
        user(id: ID!): User
        users: [User],
        getSpotlightMembers(brandId:ID): [UploadPhoto]
        getUserByFirebaseId(firebaseId: ID!): User
        getLookbookByUserId(userId: ID!): [Lookbook]
        getLookbook(id: ID!): Lookbook
        getFollowers(id:ID): [Follower]
        getFollowings(id:ID): [Follower]
        isFollowing(userId1:ID, userId2: ID): Boolean
        getUserFeedbacks(id: ID): [CustomerFeedback]
    }

    scalar Date

    type User {
        _id: ID
        displayName: String
        email: String
        hasUploads: Boolean
        pictureUrl: String
        dob: Date
        gender: String
        locationCity: String
        locationState: String
        age: String
        paymentMethod:String
        paymentUsername:String
        status: String
    }

    type Follower {
        _id: ID
        userId1: ID
        userId2: ID
        user1: User
        user2: User
    }


    type Lookbook {
        _id: ID
        userId:ID
        brandIds:[String]
        categoryIds:[String]
        uploadIds:[String]
        photoURL:String
        brands:[String]
        categories:[String]
        uploads:[String]
    }

    input UserInput {
        _id: String
        firstName: String
        lastName: String
        displayName: String
        name: String
        email: String
        pictureUrl: String
        dob: String
        gender: String
        locationCity: String
        locationState: String
        hometownCity: String
        hometownState: String
        ethnicity: String
        orientation: String
        education: String
        height: String
        facebook: String
        instagram: String
        snapchat: String
        twitter: String
        linkedin: String
        work: String
        age: String
        role: String
        paymentMethod:String
        paymentUsername:String
        status:String
    }

    input LookbookInput {
        userId:ID!
        brandIds:[String]
        categoryIds:[String]
        uploadIds:[String]
        photoURL:String
    }
    
    input AnswerFeedbackQuestionsInput {
        questionId:ID!
        answer:String
    }
    
    input AnswerFeedbackInput {
        feedbackId:ID!
        userId:ID!
        answers: [AnswerFeedbackQuestionsInput]
    }

    extend type Mutation {
        updateUser(id:ID, user: UserInput): User!
        lookbookit(data:LookbookInput):String
        unlookbookit(id:ID):String
        sendConfirmationEmail(id:ID):Boolean
        updateUserStatus(id:ID):Boolean
        deleteProfile(id:ID):Boolean
        follow(userId1:ID, userId2:ID): String
        unfollow(userId1:ID, userId2:ID): String
        answerFeedback(data:AnswerFeedbackInput):String 
    }
`

const resolvers = {
    Query: {
        ...userResolvers.queries
    },

    Mutation: {
        ...userResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}