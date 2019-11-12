const { gql } = require('apollo-server');


const productResolvers = require('../resolvers/product')

const typeDefs = gql`
    extend type Query {
        getProducts(productIds:[String]): [Product],
    }
      
    type Product {
        _id: ID!
        brand: Brand!
        category: Category!
        productName: String!
        productUrl: String!
        member: User!
        tags: [String]!
    }
    
    input ProductInput {
        brand: BrandInput!
        category: CategoryInput!
        productName: String!
        productUrl: String!
        userId: ID!
        tags: [String]!
    }
   
    extend type Mutation {
        addProduct(product: ProductInput!): String
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