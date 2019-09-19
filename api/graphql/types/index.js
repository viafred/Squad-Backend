const GraphQL = require('graphql')
const { 
    GraphQLObjectType, 
    GraphQLID, 
    GraphQLString, 
    GraphQLDateTime,
    GraphQLInt } = GraphQL

const GraphQLDate = require("graphql-iso-date");

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
        dob: { type: GraphQLDate }
        //... we need to continue adding Fields
    }
});


module.exports = {
    UserType,
}