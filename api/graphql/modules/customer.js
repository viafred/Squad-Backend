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
        getFeedbackAnswers(feedbackId:ID): CustomerFeedbackAnswers
        getCreditHistory(customerId:ID): [CustomerCredits]
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
        brand: Brand
        category: Category
        upload: UploadPhoto
        questions: [CustomerQuestion]
        uploads: [UploadPhoto]
        productUrl: String
        memberUploadId: ID
        offerType: String
        amount: Float
        createdAt: Date
        updatedAt: Date
    }
    
    type CustomerFeedbackAnswers {
        _id: ID
        customerId: ID
        uploads: [UploadPhoto]
        questions: [CustomerFeedbackQuestionAnswers]
        memberAnswers: [FeedbackMemberAnswers]
        offerType: String
        createdAt: Date
        updatedAt: Date
    }

    type QuestionAnswerCounts {
        name: String
        count: Int
    }
    
    type MemberAnswer {
        questionId: ID
        answer: String
    }
    
    type FeedbackMemberAnswers {
        _id: ID
        customerFeedbackId: ID
        userId: ID
        member: User
        answers: [MemberAnswer]
    }
    
    type CustomerFeedbackQuestionAnswers {
        _id: ID
        customerId: ID
        question: String
        answers: [QuestionAnswerCounts]
        createdAt: Date
        updatedAt: Date
    }
    
    type CustomerCredits {
        _id:ID
        customerId: ID
        customer: Customer
        amount: Float
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
        credits: [CustomerCredits]
        availableCredits: Float
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
        brandId:ID
        categoryId:ID
        uploadId:ID
        uploads:[String]
        questions:[String]
        offerType:String
        amount: Int
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
        addCredit(customerId:ID, amount: Float):String
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