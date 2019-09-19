const GraphQL = require('graphql')
const { 
    GraphQLObjectType, 
    GraphQLID, 
    GraphQLString, 
    GraphQLInt } = GraphQL

const GraphQLDate = require("graphql-iso-date");
const { GraphQLDateTime } = GraphQLDate

const UserType = new GraphQLObjectType({
    name: "User",
    fields: {
        id: { type: GraphQLID },
        firstname: { type: GraphQLString },
        lastname: { type: GraphQLString },
        email: { type: GraphQLString },
        photoUrl: { type: GraphQLString },
        role: { type: GraphQLString },
        gender: { type: GraphQLString },
        age: { type: GraphQLInt },
        // dob: { type: GraphQLString },
        location: { type: GraphQLString },
        hometown: { type: GraphQLString },
        height: { type: GraphQLString },
        orientation: { type: GraphQLString },
        education: { type: GraphQLString },
        work: { type: GraphQLString },
        createdAt: { 
            type: GraphQLDateTime, 
            resolve: () => new Date() 
        },
        updatedAt: { 
            type: GraphQLDateTime, 
            resolve: () => new Date()
        }
    }
});

module.exports = {
    UserType,
}
