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

     bookRouter.route('/getTotalBook')
      .get(async(req,res)=>{
        try {
          const totalBook = await bookList.countDocuments({});
          res.send({totalBook});
        } catch (e) {
          console.log(e);
        }
      })


     bookRouter.route('/getBookData')
      .post(async(req,res)=>{
        const data = req.body;
        const finder = {};
        if(data.type==='new') finder.bookType='new';
        else if(data.type==='old') finder.bookType='old';

        if(data.category!==null){
          finder.category = data.category;
        }

        const bookSkip = (data.page - 1)*(data.perPage);

        // console.log("Finder  ",finder);
        const result = await bookList.find(finder).skip(bookSkip).limit(data.perPage).toArray();
        res.send(result)

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
