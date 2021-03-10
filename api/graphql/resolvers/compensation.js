const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment'); // require

const uploadResolvers = require('../resolvers/uploadPhoto');

const activeCompensation = async (root, args, context, info) => {
  let oDate = new Date()

  let comp = await dbClient.db(dbName).collection("compensations").aggregate([
    {
      $lookup:{
        from: "users",
        localField : "userId",
        foreignField : "_id",
        as : "user"
      }
    },
    /*{ $match : { startDate: { $lt: oDate }, expirationDate: { $gte: oDate }, payType: "upload"  } },*/
    { $sort : { createdAt : -1 } }
  ]).toArray();

  if ( comp && comp[0] ){
    comp[0]['user'] = comp[0]['user'][0]
    return comp[0]
  }
}

const getMemberCompensations = async (root, args, context, info) => {
  const memberId = args.memberId;
  let comps = await dbClient.db(dbName).collection("compensations").aggregate([
    {
      $lookup:{
        from: "uploads",
        localField : "uploadIds",
        foreignField : "_id",
        as : "uploads"
      }
    },
    { $match : {"uploads.memberId": new ObjectId(memberId) } }
  ]).toArray();

  let uploads = []
  for ( let comp of comps ){
    uploads = comp.uploads.filter(u => u.memberId == memberId)
    comp.totalCompensation = uploads.map(u => u.earnedAmount)
    comp.totalCompensation = comp.totalCompensation.reduce((previous, next) => previous+next, 0)
    comp.totalCompensation =  parseFloat(comp.totalCompensation+"").toFixed(2)
  }

  return comps
}

const getMemberTotalEarnings = async (root, args, context, info) => {
  let memberEarnings = {}

  const uploads = await dbClient.db(dbName).collection("uploads").find({ memberId: new ObjectId(args.memberId) }).toArray();
  memberEarnings.uploads = uploads.map(u => u.earnedAmount ? u.earnedAmount : 0).reduce((previous, next) => parseFloat(previous) + parseFloat(next), 0)
  memberEarnings.offers = uploads.map(u => u.offerEarnedAmount ? u.offerEarnedAmount : 0).reduce((previous, next) => parseFloat(previous) + parseFloat(next), 0)

  return memberEarnings
}

const compensationHistory = async (root, args, context, info) => {
  let comps = await dbClient.db(dbName).collection("compensations_history").aggregate([
    {
      $lookup:{
        from: "users",
        localField : "userId",
        foreignField : "_id",
        as : "user"
      }
    }
  ]).toArray()

  let compsHistory = comps.map(c => ({...c, user: c.user[0]}))

  return compsHistory
}

/* MUTATIONS */
const saveCompensation =  async (parent, args) => {
  try {
    let compensation = {
      userId: new ObjectId(args.data.userId),
      payNum: args.data.payNum,
      payType: args.data.payType,
      payAmount: args.data.payAmount,
      uploadIds: [],
      totalCompensation: 0,
      startDate: new Date(),
      expirationDate: new Date(args.data.expiration),
      createdAt: new Date()
    };

    let id = null;
    if ( args.data.compensationId ){
        //nothing to be done YET I believe
    } else {
      comp = await dbClient.db(dbName).collection('compensations').insertOne(compensation);
      id = comp.insertedId.toString();

      //Save Compensation History
      const compensationHistory = {
        ...compensation,
        createdAt: new Date()
      }

      compHistory = await dbClient.db(dbName).collection('compensations_history').insertOne(compensationHistory);
    }

    await compensateAllUploads()
    await compensateAllProducts()
    return id;
  } catch (e) {
      return e;
  }
}

const compensateUploads =  async (parent, args) => {
  try {
    await compensateAllUploads();
    return 'ok'
  } catch (e){
    return e;
  }
}

const compensateProducts =  async (parent, args) => {
  try {
    await compensateAllProducts();
    return 'ok'
  } catch (e){
    return e;
  }
}

/* HELPER */
const availableUploadCompensation = async (oDate) => {
  let mDate = moment(oDate)
  let sDate = mDate.format("YYYY-MM-DDT23:59:59")

  let comp = await dbClient.db(dbName).collection("compensations").aggregate([
    {
      $lookup:{
        from: "users",
        localField : "userId",
        foreignField : "_id",
        as : "user"
      }
    },
    { $match : { startDate: { $lte: new Date(sDate) }, expirationDate: { $gte: new Date(sDate) }, payType: "upload"  } },
    { $sort : { createdAt : -1 } }
  ]).toArray();

  if ( comp && comp[0] ){
    comp[0]['user'] = comp[0]['user'][0]
    return comp[0]
  }

  return null;
}

const availableProductCompensation = async (oDate) => {
  let mDate = moment(oDate)
  let sDate = mDate.format("YYYY-MM-DDT23:59:59")

  let comp = await dbClient.db(dbName).collection("compensations").aggregate([
    {
      $lookup:{
        from: "users",
        localField : "userId",
        foreignField : "_id",
        as : "user"
      }
    },
    { $match : { startDate: { $lte: new Date(sDate) }, expirationDate: { $gte: new Date(sDate) }, payType: "product"  } },
    { $sort : { createdAt : -1 } }
  ]).toArray();

  if ( comp && comp[0] ){
    comp[0]['user'] = comp[0]['user'][0]
    return comp[0]
  }

  return null;
}

const compensateAllUploads = async () => {
  //Get Approved and not credited uploads
  const uploads = await dbClient.db(dbName).collection("uploads").find({ approved: true, credited: null }).toArray();

  uploads.forEach(async (upload) => {
    const activeComp = await availableUploadCompensation(upload.createdAt)
    console.log('upload', upload);
    console.log('activeComp', activeComp);

    if ( activeComp ){
      let totalCompensated = activeComp.totalCompensation

      await dbClient.db(dbName).collection("uploads").updateOne(
        { _id: new ObjectId(upload._id) },
        { $set: { credited: true, earnedAmount: activeComp.payAmount }}
      )

      totalCompensated = totalCompensated + activeComp.payAmount

      console.log('totalCompensated', totalCompensated);

      await dbClient.db(dbName).collection("compensations").updateOne(
        { _id: new ObjectId(activeComp._id) },
        { "$set": { totalCompensation: totalCompensated }, "$push": { "uploadIds": {"$each": [ new ObjectId(upload._id) ] }} }
      )
    }

  })
}

const compensateAllProducts = async () => {
  const uploads = await dbClient.db(dbName).collection("uploads").find({ approved: true, credited: null, productId: {$ne: null} }).toArray();

  uploads.forEach(async (upload) => {
    const activeComp = await availableProductCompensation(upload.createdAt)
    console.log('upload', upload);
    console.log('activeComp', activeComp);

    if ( activeComp ){
      let totalCompensated = activeComp.totalCompensation
      let uploadIds = activeComp.uploadIds ? activeComp.uploadIds : []

      await dbClient.db(dbName).collection("uploads").updateOne(
        { _id: new ObjectId(upload._id) },
        { $set:  { credited: true, earnedAmount: activeComp.payAmount } }
      )

      totalCompensated = totalCompensated + activeComp.payAmount
      uploadIds.push(new ObjectId(upload._id))

      console.log('totalCompensated', totalCompensated);

      await dbClient.db(dbName).collection("compensations").updateOne(
        { _id: new ObjectId(activeComp._id) },
        { "$set": { totalCompensation: totalCompensated }, "$push": { "uploadIds": {"$each": [ new ObjectId(upload._id) ] }} }
      )
    }

  })
}

module.exports = {
  queries: {
    activeCompensation,
    compensationHistory,
    getMemberCompensations,
    getMemberTotalEarnings
  },
  mutations: {
    saveCompensation,
    compensateUploads,
    compensateProducts
  },
  helper: {
    availableUploadCompensation,
    compensateAllUploads,
    compensateAllProducts,
  }
}