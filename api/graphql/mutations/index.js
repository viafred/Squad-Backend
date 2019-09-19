const GraphQL = require('graphql')
const { 
    GraphQLObjectType, 
    GraphQLNonNull, 
    GraphQLString, 
    GraphQLID, 
    GraphQLInt,
    GraphQLScalarType } = GraphQL

const { UserType } = require('../types')

// const GraphQLDate = require("graphql-iso-date");

const createUser = {
    type: UserType,
        args: {
        firstName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        lastName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        email: {
            type: new GraphQLNonNull(GraphQLString)
        },
        photoUrl: {
            type: GraphQLString
        },
        role: {
            type: GraphQLString
        },
        gender: {
            type: new GraphQLNonNull(GraphQLString)
        },
        age: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        dob: {
            type: new GraphQLObjectType(Object)
        }
    },
    resolve: (root, {
        firstName,
        lastName,
        email,
        photoUrl,
        role,
        gender,
        age,
        dob
    }) => {
        return new Promise((resolve, reject) => {
            /*database.run('INSERT INTO contacts (firstName, lastName, email) VALUES (?,?,?);', [firstName, lastName, email], (err) => {
                if (err) {
                    reject(null);
                }
                database.get("SELECT last_insert_rowid() as id", (err, row) => {

                    resolve({
                        id: row["id"],
                        firstName: firstName,
                        lastName: lastName,
                        email: email
                    });
                });
            });*/

            resolve([])
        })

    }
}

const updateUser = {
    type: GraphQLString,
        args: {
        id: {
            type: new GraphQLNonNull(GraphQLID)
        },
        firstName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        lastName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        email: {
            type: new GraphQLNonNull(GraphQLString)
        }
    },
    resolve: (root, {
        id,
        firstName,
        lastName,
        email
    }) => {
        return new Promise((resolve, reject) => {
            /*database.run('UPDATE contacts SET firstName = (?), lastName = (?), email = (?) WHERE id = (?);', [firstName, lastName, email, id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve(`Contact #${id} updated`);

            });*/

            resolve([])
        })
    }
}

const deleteUser = {
    type: GraphQLString,
        args: {
        id: {
            type: new GraphQLNonNull(GraphQLID)
        }
    },
    resolve: (root, { id }) => {
        return new Promise((resolve, reject) => {
            /*database.run('DELETE from contacts WHERE id =(?);', [id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve(`Contact #${id} deleted`);

            });*/

            resolve([])
        })

    }
}

module.exports = {
    createUser,
    updateUser,
    deleteUser
}