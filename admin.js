const client = require('./client');
const express = require('express');
const adminRouter = express.Router();
const { ObjectId } = require('mongodb');

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     await client.connect();

     const usersCollection = client.db('bookTreasure').collection('users');
     const bookList        = client.db('bookTreasure').collection('bookList');
     const requestBook     = client.db('bookTreasure').collection('requestBook');
     const orderList     = client.db('bookTreasure').collection('orderList');

     adminRouter.route('/getAdminApprovedBook')
     .get(async(req,res)=>{
       const list  = await requestBook.find({bookType:'old'}).toArray();
       res.send(list);
     })

     adminRouter.route('/bookStatusUpdate')
     .post(async(req,res)=>{
       const data = req.body;
       const bookId = new ObjectId(data.id);
       if(data.status=='accept'){
         const book = await requestBook.findOne({_id:bookId});
         await bookList.insertOne(book);
       }

        await requestBook.deleteOne({_id:bookId});

       res.send({status:true});
     })

     adminRouter.route('/getBookCollection')
     .post(async(req,res)=>{
       const type = req.body.type;
       let result;
       if(type==='old'){
         result = await bookList.find({bookType:type}).toArray();
       } else if(type==='new'){
         result = await bookList.find({bookType:type}).toArray();
       }
       res.send(result);
     })

     adminRouter.route('/getReport')
     .get(async(req,res)=> {
       try {
      const currentDate = new Date();
     const tenDaysAgo = new Date();
     tenDaysAgo.setDate(currentDate.getDate() - 10);

     const pipeline = [
       {
         $match: {
           date: { $gte: tenDaysAgo, $lte: currentDate },
         },
       },
       // {
       //   $group: {
       //     _id: "$bookType",
       //     totalQuantity: { $sum: "$quantity" },
       //   },
       // },
     ];

     const result = await orderList.aggregate(pipeline).toArray();
     // console.log(result);

     res.send(result);

         } catch (e) {
           console.log(e);
         }

     })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
module.exports = adminRouter;
