const client = require('./client');
const express = require('express');
const bookRouter = express.Router();
const { ObjectId } = require('mongodb');

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     await client.connect();

     const usersCollection = client.db('bookTreasure').collection('users');
     const bookList        = client.db('bookTreasure').collection('bookList');
     const requestBook     = client.db('bookTreasure').collection('requestBook');
     const categoryList    = client.db('bookTreasure').collection('category');

     //Category Edit Routes

     bookRouter.route('/getAllCategory')
     .get(async(req,res)=>{
       const data = await categoryList.find().toArray();
       res.send(data);
     })

     bookRouter.route('/addCategory')
     .post(async(req,res)=>{
       const data = req.body;
       const check = await categoryList.findOne({data});
       if(check){
         res.send({status:false});
       } else {
          await categoryList.insertOne(data);
          res.send({status:true});
       }
     })

     bookRouter.route('/deleteCategory')
     .post(async(req,res)=>{
       const id = new ObjectId(req.body);
       console.log("category Id => ",id);
       await categoryList.deleteOne({_id:id});
       res.send({status:true});
     })


     bookRouter.route('/getBookData')
      .post(async(req,res)=>{
        const data = req.body;
        console.log("Data ",data);
      })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged from Book route. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
module.exports = bookRouter;