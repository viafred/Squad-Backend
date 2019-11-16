const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const getCategories = async (root, args, context, info) => {
    const categoriesRef = dbClient.db(dbName).collection("categories");
    let categories = [];
    let find = {};
    if ( args.categoryIds ){
        let categoryIds = [];
        for ( let categoryId of args.categoryIds ){
            categoryIds.push(new ObjectId(categoryId));
        }

        find = { _id: { $in: categoryIds } };
    }

    categories = await categoriesRef.find(find).toArray();
    return categories;
}

const getCustomerCategories = async (root, args, context, info) => {
    let find = {};
    let categories = [];

    if ( args.categoryIds ){
        let categoryIds = [];
        for ( let categoryId of args.categoryIds ){
            categoryIds.push(new ObjectId(categoryId));
        }

        find = { _id: { $in: categoryIds } };
    }

    if ( args.customerId ){
        find.customerId =  new ObjectId(args.customerId);
    }

    const categoriesRef = dbClient.db(dbName).collection("customer_categories").aggregate([
        {
            $lookup:{
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categories'
            },
        },
        { $match : find }
    ]);

    categories = await categoriesRef.toArray();
    for ( let category of categories ){
        category.name = category.categories[0].name;
        category._id = category.categoryId;
    }

    return categories;
}


module.exports = {
    getCategories,
    getCustomerCategories
}