const { gql } = require('apollo-server');

const compensationResolvers = require('../resolvers/compensation')

const typeDefs = gql`
    extend type Query {
      activeCompensation: Compensation
      compensationHistory:[Compensation]
    }

    type Compensation {
      _id: ID
      startDate: Date
      expirationDate: Date
      payNum: String
      payType: String
      payAmount: String
      userId: String
      active: Boolean
      totalCompensation: Float
      user: User
    }

    
    input CompensationInput {
      compensationId:ID
      userId:ID!
      expiration: String!
      payNum: String!
      payType: String!
      payAmount: Float!
    }

    extend type Mutation {
      saveCompensation(data:CompensationInput):String
    }
`

const resolvers = {
    Query: {
        ...compensationResolvers.queries
    },

    Mutation: {
        ...compensationResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}