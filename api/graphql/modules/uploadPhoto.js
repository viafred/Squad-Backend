const { gql } = require('apollo-server');


const uploadPhotoResolvers = require('../resolvers/uploadPhoto')

const typeDefs = gql`
    extend type Query {
        getUploadedPhotos(productIds:[String]): [UploadPhoto],
        getUserUploads(userId: String): [UploadPhoto]
        getBrandUploads(brandId: String, userId: String): BrandUpload
        uploadsSearch(searchParam: String, brandIds: String, uploadIds: String, categoryIds: String): [SearchUploadPhoto]
        uploadsFilter(filter: FilterInput): [SearchUploadPhoto]
    }

    input FilterInput {
        gender: String
        location: String
        ageFrom: String
        ageTo: String
        education: String
        categoryNames: [String]
        brandNames: [String]
        productNames: [String]
    }

    type UploadPhotoLike {
        id: ID!
        member: User
        like: Boolean
    }

    type UploadPhoto {
        _id: ID!
        brand: Brand!
        category: Category!
        productName: String!
        productUrl: String!
        likes: Int
        member: User
        userLikes: [ID]
    }

    input UploadPhotoInput {
        brand: BrandInput!
        category: CategoryInput!
        productName: String!
        productUrl: String!
        userId: ID!
    }

    type SearchUser {
        _id: String
        pictureUrl: String
        role: String
        email: String
        displayName: String
        hasUploads: Boolean
    }

    type SearchBrand {
        _id: ID
        name: String
        verified: Boolean
    }

    type SearchUploadPhoto {
        _id: ID
        brand: SearchBrand
        category: SearchBrand
        productName: String
        productUrl: String
        userLikes: [String]
        member: SearchUser
    }

    type BrandUpload {
        brand: Brand,
        isSubscribed: Boolean,
        uploads: [UploadPhoto],
    }

    extend type Mutation {
        addUploadedPhoto(uploadPhoto: UploadPhotoInput!): String
        likeUploadedPhoto(id: ID, userId: ID): Boolean
    }
`

const resolvers = {
    Query: {
        ...uploadPhotoResolvers.queries
    },

    Mutation: {
        ...uploadPhotoResolvers.mutations
    }
}

module.exports = {
    typeDefs, resolvers
}