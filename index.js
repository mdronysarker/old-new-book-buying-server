require('dotenv').config()
const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;

const adminRouter = require('./admin');
const userRouter = require('./user');


app.use(cors())
app.use(express.json())

  app.use('/',adminRouter);
  app.use('/',userRouter);
  




app.get('/', (req, res) => {
    res.send('BookTreasure Website Running!')
})

app.listen(port, () => {
    console.log(`BookTreasure  Website listening on port ${port}`)
})
