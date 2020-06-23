const { gql } = require('apollo-server');


const uploadPhotoResolvers = require('../resolvers/uploadPhoto')

const typeDefs = gql`
    extend type Query {
        getUploadedPhotos(productIds:[String]): [UploadPhoto],
        getUserUploads(userId: String): [UploadPhoto]
        getBrandUploads(brandId: String, userId: String): BrandUpload
        uploadsSearch(searchParam: String, brandIds: String, uploadIds: String, categoryIds: String): [SearchUploadPhoto]
        uploadsFilter(filter: FilterInput): [SearchUploadPhoto]
        getPendingUploads: [UploadPhoto]
        getApprovedNotCredited: [UploadPhoto]
        getApprovedNotCreditedUploadedProducts: [UploadPhoto]
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
        _id: ID
        memberId: ID
        brand: Brand
        category: Category
        product: Product
        productName: String
        productUrl: String
        likes: Int
        member: User
        userLikes: [ID]
        brandName: String
        categoryName: String
        tags: [String]
    }

    input UploadPhotoInput {
        _id: ID
        brand: BrandInput
        category: CategoryInput
        product: ProductInput
        productName: String
        productUrl: String
        member: UserInput
        tags: [String]
        userId: ID
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

    type ValidateError {
        brand: String,
        category: String,
        product: String,
        errorCount: Int
    }

    extend type Mutation {
        addUploadedPhoto(uploadPhoto: UploadPhotoInput!): String
        updateUploadedPhoto(uploadPhoto: UploadPhotoInput!): String
        likeUploadedPhoto(id: ID, userId: ID): Boolean
        validateUpload(id: ID!): ValidateError
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