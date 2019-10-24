
const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const customers = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        let collection = database.collection('customers').get();

        collection.then( collection => {
                let customers = [];
                if (collection.empty) {
                    resolve([]);
                }

                collection.forEach( doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    customers.push(data);
                });

                resolve(customers)
            })
            .catch(err => {
                reject(err);
            });
    });
}

const customer = (root, { id }, context, info) => {
    return new Promise((resolve, reject) => {
        let customer = database.collection('customers').doc(id).get();
        customer.then(doc => {
                if (!doc.exists) {
                    reject('Customer does not exists');
                } else {
                    let data = doc.data();
                    data.id = doc.id;
                    resolve(data)
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}


const updateCustomer =  (parent, args) => {
    return new Promise(async (resolve, reject) => {

        let customerInput = JSON.parse(JSON.stringify(args.customer));

        let brandCollection = await database.collection('brands').where("name", "==", customerInput.companyBrand).get();
        let brandRef = null;
        if ( !brandCollection.empty ){
            brandCollection.forEach(async doc =>  {
                let brandData = doc.data();
                if ( brandData.name === customerInput.companyBrand ){
                    brandRef = database.collection('brands').doc(doc.id);
                    await brandRef.set({verified: true}, {merge: true});
                }
            })
        } else {
            brandRef = await database.collection('brands').add({name: customerInput.companyBrand, verified: true});
        }

        customerInput.brand = brandRef;
        customerInput.finishSteps = true;
        let customer = database.collection('customers').doc(args.id).set(customerInput, {merge: true});
        customer = database.collection('customers').doc(args.id).get();
        customer.then(doc => {
            if (!doc.exists) {
                reject('Customer does not exists');
            } else {
                let data = doc.data();
                data.id = doc.id;
                resolve(data)
            }
        }).catch(err => {
                reject(err);
            });
    });
}


module.exports = {
    queries: {
        customers,
        customer
    },
    mutations: {
        updateCustomer
    }
}