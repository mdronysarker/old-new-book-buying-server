const client = require('./client');
const express = require('express');
const userRouter = express.Router();
const { ObjectId } = require('mongodb');

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const usersCollection = client.db('bookTreasure').collection('users');
        const bookList        = client.db('bookTreasure').collection('bookList');
        const requestBook     = client.db('bookTreasure').collection('requestBook');
        const cartList        = client.db('bookTreasure').collection('cartList');

        userRouter.route('/users')
            .post(async (req, res) => {
                const user = req.body;
                const query = { email: user.email }
                const existingUser = await usersCollection.findOne(query)
                if (existingUser) {
                    return res.send({ message: 'user already exists' })
                }
                const result = await usersCollection.insertOne(user);
                res.send(result)
            })


           userRouter.route('/findUserByEmail')
           .post(async(req,res)=>{
             const email = req.body;
             const user = await usersCollection.findOne(email);
              res.send(user);
           })

           userRouter.route('/AddBook')
           .post(async(req,res)=>{
             const data = req.body;
             await requestBook.insertOne(data);
             res.send({status:true});
           })

           // Cart List
           userRouter.route('/addToCart')
           .post(async(req,res)=>{
             const data = req.body;
             await cartList.insertOne(data);
             res.send({status:true});
           })

userRouter.route('/findCartItem').post(async (req, res) => {
  try {
    const userId = req.body.userId;
    const result = await bookList.aggregate([{
        $lookup: {
          from: "cartList",
          let: { bookId: '$_id' },
          pipeline: [{
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", userId] },
                    { $eq: [{ $toString: "$productId" }, { $toString: "$$bookId" }] }
                  ]
                }
              }
            }
          ],
          as: "joinedData"
        }
      },{
        $unwind: "$joinedData"
      },{
        $project: {
          _id: 1, // Exclude the default _id field
          image: 1,
          bookName: 1,
          price: 1,
          bookQuantity:1
        }
      }
    ]).toArray();

    console.log("result => ", result);
    res.json(result);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





        // Send a ping to confirm a successful connection
        await client.db("user").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);
module.exports = userRouter;
