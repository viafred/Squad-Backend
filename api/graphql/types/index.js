const GraphQL = require('graphql')
const { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLDateTime } = GraphQL

const GraphQLDate = require("graphql-iso-date");

const UserType = new GraphQLObjectType({
    name: "User",
    fields: {
        id: { type: GraphQLID },
        firstname: { type: GraphQLString },
        lastname: { type: GraphQLString },
        email: { type: GraphQLString },
        gender: { type: GraphQLString }
        //... we need to continue adding Fields
    }
});


module.exports = {
    UserType,
}