const GraphQL = require('graphql');
const { 
    GraphQLNonNull, 
    GraphQLList,
    GraphQLString, 
    GraphQLID, 
    GraphQLInt } = GraphQL

const { UserType } = require('../types')

const createUser = {
    type: UserType,
        args: {
        firstName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        lastName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        displayName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        email: {
            type: new GraphQLNonNull(GraphQLString)
        },
        photoUrl: {
            type: GraphQLString
        },
        role: {
            type: new GraphQLNonNull(GraphQLString)
        },
        gender: {
            type: new GraphQLNonNull(GraphQLString)
        },
        age: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        dob: { 
            type: GraphQLString
        },
        location: {
            type: GraphQLString
        },
        hometown: {
            type: new GraphQLNonNull(GraphQLString)
        },
        orientation: {
            type: GraphQLString
        },
        education: {
            type: GraphQLString
        },
        work: {
            type: GraphQLString
        },
        createdAt: {
            type: GraphQLString
        },
        updatedAt: {
            type: GraphQLString
        }, 
    },
    resolve: (root, {
        firstName,
        lastName,
        email,
        photoUrl,
        role,
        gender,
        age,
        dob,
        location,
        hometown,
        orientation,
        education,
        work,
        createdAt
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
        },
        updatedAt: {
            type: GraphQLString
        }
    },
    resolve: (root, {
        id,
        firstName,
        lastName,
        email,
        updatedAt
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