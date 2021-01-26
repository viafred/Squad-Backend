const { gql } = require('apollo-server');


const customerResolvers = require('../resolvers/customer')

const typeDefs = gql`
    extend type Query {
        getCustomer(id: String): Customer
        getCustomerGroups(customerId: String): [CustomerGroup]
        getCustomerFeedbacks(customerId: String): [CustomerFeedback]
        getCustomerBrandsAndCategories(customerId: String): BrandAndCategory
        getCustomerBrandsCategoriesProducts(customerId: String, brandIds:[String], categoryIds:[String], productIds: [String]): BrandCategoryProduct
        getCustomerProducts(customerId: String, brandIds:[String], categoryIds:[String], productIds: [String]): [Product]
        customers: [Customer]
        getPendingCustomers: [Customer]
        getCustomerQuestion(questionId:ID):CustomerQuestion
        getCustomerQuestions(customerId:ID): [CustomerQuestion]
    }

    type CustomerQuestion {
        _id: ID
        customerId: ID
        question: String
        answers: [String]
        createdAt: Date
        updatedAt: Date
    }
    
    type CustomerGroup {
        _id: ID
        customerId: ID
        name: String
        uploads: [UploadPhoto]
    }

    type CustomerFeedback {
        _id: ID
        customerId: ID
        questions: [CustomerQuestion]
        uploads: [UploadPhoto]
        productUrl: String
        offerType: String
        createdAt: Date
        updatedAt: Date
    }

    type Customer {
        _id: ID
        status:String
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
        brand: Brand
        createdAt: Date
        updateAt: Date
    }

    input CustomerInput {
        _id: String
        brandId: String
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
        status: String
        provisioned: Boolean,
        username: String,
        password: String
    }

    input GroupInput {
        customerId:ID!
        uploadIds:[String]
        name:String
    }

    input FeedbackInput {
        customerId:ID
        uploads:[String]
        questions:[String]
        offerType:String
    }
    
    input QuestionInput {
        _id:ID,
        customerId:ID,
        question: String
        answers: [String]
    }

    extend type Mutation {
        saveCustomer(id:ID, customer: CustomerInput): Customer!
        verifyCustomer(id:ID): String
        createGroup(data:GroupInput):String
        saveFeedback(data:FeedbackInput):String
        saveQuestion(question:QuestionInput!):String
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