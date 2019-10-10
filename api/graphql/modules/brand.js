const { gql } = require('apollo-server');


const brandResolvers = require('../resolvers/brand')

const typeDefs = gql`
    extend type Query {
        brands: [Brand]
    }
    
    type Brand {
        id: ID!
        guid: String
        title: String
        description: String
        about: String
    }
   
`

const resolvers = {
    Query: {
        ...brandResolvers
    },

    Mutation: {

    }
}

module.exports = {
    typeDefs, resolvers
}