const client = require('./client');
const express = require('express');
const supplierRouter = express.Router();
const { ObjectId } = require('mongodb');

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     await client.connect();

     const usersCollection = client.db('bookTreasure').collection('users');
     const bookList        = client.db('bookTreasure').collection('bookList');
     const requestBook     = client.db('bookTreasure').collection('requestBook');

     supplierRouter.route('/getsupplierApprovedBook')
     .get(async(req,res)=>{
       const list  = await requestBook.find({bookType:'new'}).toArray();
       res.send(list);
     })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged from Supplier route. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
module.exports = supplierRouter;
