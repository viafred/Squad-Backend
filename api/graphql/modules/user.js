const { gql } = require('apollo-server');


const userResolvers = require('../resolvers/user')

const typeDefs = gql`
    extend type Query {
        user(id: ID!): User
        users: [User],
        getSpotlightMembers: [UploadPhoto]
        getUserByFirebaseId(firebaseId: ID!): User
        getLookbookByUserId(userId: ID!): [Lookbook]
        getLookbook(id: ID!): Lookbook
    }

    type User {
        _id: ID
        displayName: String
        email: String
        hasUploads: Boolean
        pictureUrl: String
        dob: String
        gender: String
        locationCity: String
        locationState: String
        age: String
        paymentMethod:String
        paymentUsername:String
    }

    type Lookbook {
        _id: ID
        userId:ID
        brandIds:[String]
        categoryIds:[String]
        uploadIds:[String]
        photoURL:String
        brands:[String]
        categories:[String]
        uploads:[String]
    }

    input UserInput {
        _id: String
        firstName: String
        lastName: String
        displayName: String
        name: String
        email: String
        pictureUrl: String
        dob: String
        gender: String
        locationCity: String
        locationState: String
        hometownCity: String
        hometownState: String
        ethnicity: String
        orientation: String
        education: String
        height: String
        facebook: String
        instagram: String
        snapchat: String
        twitter: String
        linkedin: String
        work: String
        age: String
        role: String
        paymentMethod:String
        paymentUsername:String
    }

    input LookbookInput {
        userId:ID!
        brandIds:[String]
        categoryIds:[String]
        uploadIds:[String]
        photoURL:String
    }

    extend type Mutation {
        updateUser(id:ID, user: UserInput): User!
        lookbookit(data:LookbookInput):String
    }
`

const resolvers = {
    Query: {
        ...userResolvers.queries
    },

    Mutation: {
        ...userResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}