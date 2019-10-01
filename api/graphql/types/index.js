const GraphQL = require('graphql')
const { 
    GraphQLObjectType, 
    GraphQLList,
    GraphQLID, 
    GraphQLString, 
    GraphQLInt } = GraphQL

const GraphQLDate = require("graphql-iso-date");

const UserType = new GraphQLObjectType({
    name: "User",
    fields: {
        id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        displayName: {type: GraphQLString },
        email: { type: GraphQLString },
        photoUrl: { type: GraphQLString },
        role: { type: GraphQLString },
        gender: { type: GraphQLString },
        age: { type: GraphQLInt },
        dob: { type: GraphQLDate },
        location: { type: GraphQLString },
        hometown: { type: GraphQLString },
        height: { type: GraphQLString },
        orientation: { type: GraphQLString },
        education: { type: GraphQLString },
        work: { type: GraphQLString },
        socialNetworks: {type: new GraphQLList(SocialNetwork)},
        brands,
        channels,
        notifications, 
        uploads,
        products,
        earnings,
        surveys,
        polls,
        createdAt,
        updatedAt
        // createdAt: { 
        //     type: GraphQLDateTime, 
        //     resolve: () => new Date() 
        // },
        // updatedAt: { 
        //     type: GraphQLDateTime, 
        //     resolve: () => new Date()
        // }
    }
});

const SocialNetwork = new GraphQLObjectType({
    name: "Social Network",
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLID },
        url: { type: GraphQLID },
    }
});



module.exports = {
    UserType,
}
