const { gql } = require('apollo-server');

const compensationResolvers = require('../resolvers/compensation')

const typeDefs = gql`
    extend type Query {
      activeCompensation: Compensation
      compensationHistory:[Compensation]
      getMemberCompensations(memberId: String): [Compensation]
      getMemberTotalEarnings(memberId: String): TotalEarning
    }

    type TotalEarning {
      uploads: Float
      offers: Float
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
      memberCompensation: Float
      user: User
      createdAt: Date
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