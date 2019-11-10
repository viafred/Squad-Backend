const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const getCategories = async (root, args, context, info) => {
    const categoriesRef = dbClient.db(dbName).collection("categories");
    const categories = await categoriesRef.find({}).toArray();

    return categories;
}


module.exports = {
    getCategories
}