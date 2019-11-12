const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const customers = async (root, args, context, info) => {
    const customersRef = dbClient.db(dbName).collection("customers");
    const customers = await customersRef.find({}).toArray();

    return customers;
}

const getCustomer = async(root, args, context, info) => {
    const customers = await dbClient.db(dbName).collection("customers").aggregate([
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
            }
        },
        { $match : { _id : new ObjectId(args.id) } }
    ]).limit(1).toArray();


    let customer = customers[0];
    customer.brand = customer.brand[0];

    return customer;
}


const updateCustomer =  async (parent, args) => {
    let customerInput = JSON.parse(JSON.stringify(args.customer));
    let _id = new ObjectId(args.id);


    let brand = await dbClient.db(dbName).collection('brands').aggregate(
        [
            {
                $project:
                    {
                        name: { $toLower: "$name" },
                    }
            },
            { $match : { name : customerInput.companyBrand.toLowerCase() } }
        ]
    ).toArray();

    console.log(brand);

    if (brand.length > 0){
        customerInput.brandId = new ObjectId(brand[0]._id);

        await dbClient.db(dbName).collection('brands').updateOne(
            { _id: new ObjectId(brand[0]._id) },
            {
                $set: {verified: true},
                $currentDate: { updatedAt: true }
            }
        );
    } else {
        brand = await dbClient.db(dbName).collection('brands').insertOne({name: customerInput.companyBrand, verified: true});

        customerInput.brandId = brand.insertedId;
    }

    customerInput.finishSteps = true;

    delete customerInput._id;
    await dbClient.db(dbName).collection('customers').updateOne(
        { _id: new ObjectId(_id) },
        {
            $set: customerInput,
            $currentDate: { updatedAt: true }
        }
    );

    return { _id: new ObjectId(args.id) };
}


module.exports = {
    queries: {
        customers,
        getCustomer
    },
    mutations: {
        updateCustomer
    }
}