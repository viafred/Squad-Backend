const { gql } = require('apollo-server');


const uploadPhotoResolvers = require('../resolvers/uploadPhoto')

const typeDefs = gql`
    extend type Query {
        getUploadedPhotos: [UploadPhoto],
        getUserUploads(userId: String): [UploadPhoto]
    }
    
    type UploadPhoto {
        id: ID!
        brand: Brand!
        category: Category!
        productName: String!
        productUrl: String!
        likes: Int
        member: User
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