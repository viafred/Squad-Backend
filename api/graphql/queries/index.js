const GraphQL = require('graphql')
const { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLID } = GraphQL

const { UserType } = require('../types')
const resolvers = require('../resolvers')

const users =  {
    type: GraphQLList(UserType),
    resolve: resolvers.users
}


const user =  {
    type: UserType,
        args: {
            id: {
                type: new GraphQLNonNull(GraphQLID)
            }
        },
    resolve: resolvers.user
}



module.exports = {
    users,
    user,
}