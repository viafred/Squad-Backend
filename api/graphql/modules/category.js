const { gql } = require('apollo-server');


const categoryResolvers = require('../resolvers/category')

const typeDefs = gql`
    extend type Query {
        categories: [Category]
    }
    
    type Category {
        id: ID!
        name: String
    }
   
`

const resolvers = {
    Query: {
        ...categoryResolvers
    },

    Mutation: {

    }
}

module.exports = {
    typeDefs, resolvers
}