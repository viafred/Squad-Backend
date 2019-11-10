const { gql } = require('apollo-server');


const categoryResolvers = require('../resolvers/category')

const typeDefs = gql`
    extend type Query {
        getCategories: [Category]
    }
    
    input CategoryInput {
        id: ID
        name: String,
        verified: Boolean
    }
    
    type Category {
        _id: ID
        name: String,
        verified: Boolean
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