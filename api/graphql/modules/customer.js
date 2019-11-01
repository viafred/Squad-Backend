const { gql } = require('apollo-server');


const customerResolvers = require('../resolvers/customer')

const typeDefs = gql`
    extend type Query {
        customer(id: ID!): Customer
        customers: [Customer]
    }
    
    type Customer {
        id: ID
        user: User
        companyName: String
        companyAddress1: String
        companyAddress2: String
        city: String
        state: String
        zipcode: String
        companyWebsite: String
        companyBrand: String
        companyLogo: String
        firstName: String
        lastName: String
        title: String
        email: String
        phone: String
        billingFirstName: String
        billingLastName: String
        billingTitle: String
        billingEmail: String
        billingPhoneNumber: String
        billingCompanyAddress1: String
        billingCompanyAddress2: String
        billingCity: String
        billingState: String
        billingZipcode: String
    }
    
    input CustomerInput {
        id: String
        companyName: String
        companyAddress1: String
        companyAddress2: String
        city: String
        state: String
        zipcode: String
        companyWebsite: String
        companyBrand: String
        companyLogo: String
        companyBanner: String
        firstName: String
        lastName: String
        title: String
        email: String
        phone: String
        billingFirstName: String
        billingLastName: String
        billingTitle: String
        billingEmail: String
        billingPhoneNumber: String
        billingCompanyAddress1: String
        billingCompanyAddress2: String
        billingCity: String
        billingState: String
        billingZipcode: String
        finishSteps: Boolean
    }
    
    extend type Mutation {
        updateCustomer(id:ID, customer: CustomerInput): Customer!
    }
`

const resolvers = {
    Query: {
        ...customerResolvers.queries
    },

    Mutation: {
        ...customerResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}