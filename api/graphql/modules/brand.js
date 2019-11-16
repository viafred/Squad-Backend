const { gql } = require('apollo-server');


const brandResolvers = require('../resolvers/brand')

const typeDefs = gql`
    extend type Query {
        getBrands(brandIds:[String]): [Brand],
        getBrandsAndCategories: BrandAndCategory
        getBrandsAndProducts(brandIds:[String], productIds: [String]): BrandAndProduct 
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
        _id: ID
        name: String
        verified: Boolean
    }
    
    type BrandAndCategory {
        brands: [Brand],
        categories: [Category],
    }
    
    type BrandAndProduct {
        brands: [Brand],
        products: [Product],
    }
    
    type BrandCategoryProduct {
        brands: [Brand],
        categories: [Category],
        products: [Product]
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