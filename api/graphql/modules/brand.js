const { gql } = require('apollo-server');


const brandResolvers = require('../resolvers/brand')

const typeDefs = gql`
    extend type Query {
        getBrands: [Brand],
        getBrandsAndCategories: BrandAndCategory
        getSubscribedBrands(userId: ID):[Brand]
    }
    
    type Brand {
        _id: ID
        name: String
        verified: Boolean
        banner: String
        logo: String
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
    
    extend type Mutation {
        subscribeToBrand(id: ID, userId: ID): Boolean
    }
`

const resolvers = {
    Query: {
        ...brandResolvers.queries
    },

    Mutation: {
        ...brandResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}