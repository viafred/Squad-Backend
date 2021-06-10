const { gql } = require('apollo-server');

const compensationResolvers = require('../resolvers/compensation')

const typeDefs = gql`
    extend type Query {
      activeCompensation: Compensation
      compensationHistory:[Compensation]
      getMemberCompensations(memberId: String): [Compensation]
      getMemberTotalEarnings(memberId: String): TotalEarning
      getMembersCompensationAdminLedger(month:Int, year:Int): [MemberEarningList]
      getCompensationAdminLedgerHistory(memberId:ID): [MemberEarnings]
      getDisburedEarnings(memberId:ID): [MemberEarnings]
    }

    type TotalEarning {
      uploads: Float
      offers: Float
    }
    
    type MemberEarningList {
        memberId: ID
        member: User
        totalEarningsUpload: Float
        totalEarningsOffer: Float
        createdAt: Date
        disbursed: Boolean
    }
    
    type MemberEarnings {
        _id: ID
        memberId: ID
        member: User
        amount: Float
        payed: Boolean
        type: String
        entityId: ID
        createdAt: Date
        paymentDate: Date
        paymentNumber: String
        flagged: Boolean
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
      compensateUploads(id:String):String
      compensateProducts(id:String):String
      flagCompensationEarning(entityId: ID, type: String): String
      disburseEarning(memberId: ID, month: Int, year: Int): String
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