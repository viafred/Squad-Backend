const { gql } = require('apollo-server');


const userResolvers = require('../resolvers/user')

const typeDefs = gql`
    extend type Query {
        user(id: ID!): User
        users: [User],
        getSpotlightMembers: [UploadPhoto]
    }
    
    type User {
        id: ID!
        displayName: String
        email: String
        hasUploads: Boolean
        photoURL: String
    }
    
    input UserInput {
        id: String
        displayName: String
        email: String
        photoURL: String
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
    }
    
    extend type Mutation {
        updateUser(id:ID, user: UserInput): User!
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