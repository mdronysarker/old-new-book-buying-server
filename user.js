const client = require("./client");
const express = require("express");
const userRouter = express.Router();
const { ObjectId } = require("mongodb");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("bookTreasure").collection("users");
    const bookList = client.db("bookTreasure").collection("bookList");
    const requestBook = client.db("bookTreasure").collection("requestBook");
    const cartList = client.db("bookTreasure").collection("cartList");
    const orderList = client.db("bookTreasure").collection("orderList");
    const addressList = client.db("bookTreasure").collection("addressList");

    userRouter.route("/users").post(async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    userRouter.route("/findUserByEmail").post(async (req, res) => {
      const email = req.body;
      const user = await usersCollection.findOne(email);
      res.send(user);
    });

    userRouter.route("/AddBook").post(async (req, res) => {
      const data = req.body;
      await requestBook.insertOne(data);
      res.send({ status: true });
    });

    // Cart List
    userRouter.route("/addToCart").post(async (req, res) => {
      const data = req.body;
      const findBook = await cartList
        .find({ $and: [{ userId: data.userId, productId: data.productId }] })
        .toArray();
      if (findBook.length > 0) {
        res.send({ status: false });
      } else {
        await cartList.insertOne(data);
        res.send({ status: true });
      }
    });

    userRouter.route("/findCartItem").post(async (req, res) => {
      try {
        const userId = req.body.userId;
        const result = await bookList
          .aggregate([
            {
              $lookup: {
                from: "cartList",
                let: { bookId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$userId", userId] },
                          {
                            $eq: [
                              { $toString: "$productId" },
                              { $toString: "$$bookId" },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "joinedData",
              },
            },
            {
              $unwind: "$joinedData",
            },
            {
              $project: {
                bookId: 1,
                _id: 1,
                image: 1,
                productName: 1,
                price: 1,
                productQuantity: 1,
                bookType: 1,
                userId: 1,
              },
            },
          ])
          .toArray();
        //   console.log("result => ", result);
        res.json(result);
      } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    //Book Details
    userRouter.route("/getProductDetails").post(async (req, res) => {
      //  console.log('productId => ',req.body);
      const productId = new ObjectId(req.body.productId);
      const book = await bookList.findOne({ _id: productId });
      res.send(book);
    });

    userRouter.route("/getRelatedBook").post(async (req, res) => {
      const data = req.body.category;
      const list = await bookList.find({ category: data }).limit(3).toArray();
      res.send(list);
    });

    userRouter.route("/deleteCartItem").post(async (req, res) => {
      const productId = req.body.productId;
      await cartList.deleteOne({ productId });
      res.send({ status: true });
    });

    userRouter.route("/addCompleteOrder").post(async (req, res) => {
      try {
        const { invoiceId, address, city, house, name } = req.body;
        const orders = req.body.productList;

        // who is ordered userID
        const userId = new ObjectId(req.body.userId);

        for (order of orders) {
          const type = order.bookType;

          const bookAdderId = new ObjectId(order.userId);
          const admin = await usersCollection.findOne({ userRole: "admin" });
          const bookAdder = await usersCollection.findOne({ _id: bookAdderId });
          let adminMoney;
          if (type === "new") {
            adminMoney = admin.totalMoney + order.quantity * order.price;
          } else if (type === "old") {
            adminMoney =
              admin.totalMoney +
              order.quantity * order.price -
              order.quantity * order.price * 0.1;
            //  const user = await usersCollection.findOne({_id:userId});
            const userMoney =
              bookAdder.totalMoney + order.quantity * order.price * 0.1;
            //  console.log('userId userMoney => ',userId,+' '+ userMoney+' '+order.quantity);
            await usersCollection.updateOne(
              { _id: bookAdderId },
              { $set: { totalMoney: userMoney } }
            );
          }
          //  console.log('admin => ',adminMoney);
          await usersCollection.updateOne(
            { userRole: "admin" },
            { $set: { totalMoney: adminMoney } }
          );

          const orderItem = {
            productName: order.productName,
            quantity: order.quantity,
            price: order.price * order.quantity,
            userId: req.body.userId,
            date: new Date(),
            bookId: order._id,
            bookType: order.bookType,
            singlePrice: order.price,
            invoiceId,
            address,
            city,
            house,
            name,
            delivered: false,
          };

          await orderList.insertOne(orderItem);

          const productId = new ObjectId(order._id);
          const orderQuantity = order.quantity;
          const product = await bookList.findOne({ _id: productId });
          const productQuantity = product.productQuantity;

          if (orderQuantity < productQuantity) {
            const dif = productQuantity - orderQuantity;
            await bookList.updateOne(
              { _id: productId },
              { $set: { bookQuantity: dif } }
            );
          } else if (orderQuantity === productQuantity) {
            await bookList.deleteOne({ _id: productId });
          }

          await cartList.deleteOne({ userId: req.body.userId });

          // console.log(req.body.userId);
        }
      } catch (e) {
        console.log(e);
      } finally {
        res.send({ status: true });
      }
    });

    userRouter.route("/getPrevousOrder").post(async (req, res) => {
      try {
        const userId = req.body.userId;
        const list = await orderList.find({ userId }).toArray();
        res.send(list);
      } catch (e) {
        console.log(e);
      }
    });

    userRouter.route("/getUserInfo").post(async (req, res) => {
      try {
        const userId = new ObjectId(req.body.userId);
        const result = await usersCollection.findOne({ _id: userId });
        res.send(result);
      } catch (e) {
        console.log(e);
      }
    });

    userRouter.route("/getNewarrivalBookList").get(async (req, res) => {
      try {
        const result = await bookList
          .find({})
          .sort({ createdAt: -1 })
          .limit(4)
          .toArray();
        res.send(result);
      } catch (e) {
        console.log(e);
        res.status(500).send("Internal Server Error");
      }
    });

    userRouter.route("/getBestSellerBookList").get(async (req, res) => {
      try {
        const result = await bookList
          .find({})
          .sort({ bookQuantity: -1 })
          .limit(4)
          .toArray();
        res.send(result);
      } catch (e) {
        console.log(e);
        res.status(500).send("Internal Server Error");
      }
    });

    userRouter.route("/addAddress").post(async (req, res) => {
      try {
        const data = req.body;
        await addressList.insertOne(data);
        res.send({ status: true });
      } catch (e) {
        console.error(e);
      }
    });

    userRouter.route("/getAddress").post(async (req, res) => {
      try {
        const userId = req.body;
        const address = await addressList
          .find(userId)
          .sort({ date: -1 })
          .limit(1)
          .toArray();
        res.send(address);
        // console.log(address);
      } catch (e) {
        console.error(e);
      }
    });

    userRouter.route("/getCheckoutList").post(async (req, res) => {
      try {
        const userId = req.body.userId;
        const list = await orderList
          .find({ userId, delivered: false })
          .toArray();
        // console.log('order list => ',list);
        res.send(list);
      } catch (e) {
        console.error(e);
      }
    });

    userRouter.route("/getAdminDeliveryList").get(async (req, res) => {
      try {
        const list = await orderList.find().toArray();
        res.send(list);
      } catch (e) {
        console.error(e);
      }
    });

    userRouter.route("/updateDeliveryList").post(async (req, res) => {
      try {
        const id = new ObjectId(req.body.orderId);
        await orderList.updateOne({ _id: id }, { $set: { delivered: true } });
        res.send({ status: true });
      } catch (e) {
        console.error(e);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("user").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
module.exports = userRouter;
