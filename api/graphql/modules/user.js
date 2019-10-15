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
        id: ID!
        displayName: String
        email: String
    }
    
    extend type Mutation {
        updateUser(user: UserInput): User!
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