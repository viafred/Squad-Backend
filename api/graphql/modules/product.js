const { gql } = require('apollo-server');


const productResolvers = require('../resolvers/product')

const typeDefs = gql`
    extend type Query {
        getProducts(productIds:[String]): [Product],
    }
      
    type Product {
        _id: ID!
        brand: Brand
        category: Category
        productName: String
        productUrl: String
        productTags: [String]
        customer: Customer
        tags: [String]
    }
    
    input ProductInput {
        _id: ID
        brand: BrandInput!
        category: CategoryInput!
        productName: String!
        productUrl: String!
        customerId: String!
        productTags: [String]!
    }
    
    type CategoryAndProduct {
        categories: [Category],
        products: [Product],
    }
   
    extend type Mutation {
        addProduct(product: ProductInput!): String
        updateProduct(product: ProductInput!): String
        removeProduct(id: String): String
    }
`

const resolvers = {
    Query: {
        ...productResolvers.queries
    },

    Mutation: {
        ...productResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}