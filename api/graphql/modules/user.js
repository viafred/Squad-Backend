const { gql } = require('apollo-server');


const userResolvers = require('../resolvers/user')

const typeDefs = gql`
    extend type Query {
        user(id: ID!): User
        users: [User],
    }
    
    type User {
        id: ID!
        displayName: String
        email: String,
        brands: [Brand]
    }
    
    type Mutation {
        updateUser(id: ID!, displayName: String!, email:String!): User!
    }
`

const resolvers = {
    Query: {
        ...userResolvers
    },

    Mutation: {
        updateUser: (parent, args) => {
            console.log(args);
        }
    }
}

module.exports = {
    typeDefs, resolvers
}