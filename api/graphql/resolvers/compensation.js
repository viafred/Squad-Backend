const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const uploadResolvers = require('../resolvers/uploadPhoto');

const activeCompensation = async (root, args, context, info) => {
  let comp = await dbClient.db(dbName).collection("compensations").aggregate([
    {
      $lookup:{
        from: "users",
        localField : "userId",
        foreignField : "_id",
        as : "user"
      }
    },
    { $match : {active: true} }
  ]).toArray();

  if ( comp && comp[0] ){
    comp[0]['user'] = comp[0]['user'][0]
    return comp[0]
  }

  return null;
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
  let compUploads = await getMemberCompensations(root, args, context, info)
  let memberEarnings = {}
  memberEarnings.uploads = compUploads.map(u => u.totalCompensation)
  memberEarnings.uploads = memberEarnings.uploads.reduce((previous, next) => parseFloat(previous) + parseFloat(next), 0)
  memberEarnings.offers = 0
  //TODO

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
      totalCompensation: 0,
      startDate: new Date(),
      expirationDate: new Date(args.data.expiration)
    };

    let id = null;
    if ( args.data.compensationId ){
        //nothing to be done YET I believe
    } else {
      //Deactivate Current Active Compensation
      const activeComp = await activeCompensation()
      if ( activeComp ){
        await dbClient.db(dbName).collection('compensations').updateOne(
          { _id: activeComp._id },
          {
              $set: {active: false},
              $currentDate: { updatedAt: true }
          }
        );
      }

      //Get Approved and not credited uploads
      //Compensate uploads
      const compensatedResult = uploadResolvers.helper.compensate(args.data.payType, args.data.payAmount)

      compensation['active'] = true
      compensation['createdAt'] = new Date()
      compensation['uploadIds'] = compensatedResult.uploadIds
      compensation['totalCompensation'] = compensatedResult.totalCompensated

      comp = await dbClient.db(dbName).collection('compensations').insertOne(compensation);
      id = comp.insertedId.toString();

      //Save Compensation History
      const compensationHistory = {
        ...compensation,
        createdAt: new Date()
      }

      delete compensationHistory['active']
      compHistory = await dbClient.db(dbName).collection('compensations_history').insertOne(compensationHistory);
    }

    return id;
  } catch (e) {
      return e;
  }
}

module.exports = {
  queries: {
    activeCompensation,
    compensationHistory,
    getMemberCompensations,
    getMemberTotalEarnings
  },
  mutations: {
    saveCompensation
  }
}