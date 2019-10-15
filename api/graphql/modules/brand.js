const { gql } = require('apollo-server');


const brandResolvers = require('../resolvers/brand')

const typeDefs = gql`
    extend type Query {
        getBrands: [Brand],
        getBrandsAndCategories: BrandAndCategory
    }
    
    type Brand {
        id: ID
        name: String
        verified: Boolean
    }
   
    input BrandInput {
        id: ID
        name: String
        verified: Boolean
    }
    
    type BrandAndCategory {
        brands: [Brand],
        categories: [Category],
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