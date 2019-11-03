const { gql } = require('apollo-server');


const uploadPhotoResolvers = require('../resolvers/uploadPhoto')

const typeDefs = gql`
    extend type Query {
        getUploadedPhotos: [UploadPhoto],
        getUserUploads(userId: String): [UploadPhoto]
        getBrandUploads(brandId: String, userId: String): BrandUpload
    }
    
    type UploadPhotoLike {
        id: ID!
        member: User
        like: Boolean
    }
    
    type UploadPhotoLikeInput {
        id: ID
        member: User
        like: Boolean
    }
    
    type UploadPhoto {
        id: ID!
        brand: Brand!
        category: Category!
        productName: String!
        productUrl: String!
        likes: Int
        member: User
        userLikes: [UploadPhotoLike]
    }
    
    type BrandUpload {
        brand: Brand,
        isSubscribed: Boolean,
        uploads: [UploadPhoto],
    }
  
    input UploadPhotoInput {
        brand: BrandInput!
        category: CategoryInput!
        productName: String!
        productUrl: String!
        userId: ID!
    }

    extend type Mutation {
        addUploadedPhoto(uploadPhoto: UploadPhotoInput!): UploadPhoto
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