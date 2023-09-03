const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const port = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e6utb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    // console.log('database is connected');
    const database = client.db("supple_smile");
    const lipsticksCollection = database.collection("lipsticks");
    // const inventory = database.collection("inventory");
    const orderCollection = database.collection("orders");
    const reviewCollection = database.collection("review");
    const usersCollection = database.collection("users");

    // POST API FOR ADD A PRODUCT
    app.post("/lipsticks", async (req, res) => {
      const newLipstick = req.body;
      // console.log(newLipstick);
      const result = await lipsticksCollection.insertOne(newLipstick);
      res.json(result);
    });

    // POST API FOR REVIEW
    app.post("/review", async (req, res) => {
      const reviewDetails = req.body;
      const result = await reviewCollection.insertOne(reviewDetails);
      res.json(result);
      // console.log(result);
    });

    // POST api for lipsticks order
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const ordersProduct = order.orderProducts;

      if (ordersProduct.length) {
        for (const product of ordersProduct) {
          console.log({ product });
          const newData = await lipsticksCollection.updateMany(
            { _id: ObjectId(product._id) },
            { $inc: { quantity: -product.quantity } }
          );
          console.log({ newData });
        }
      }

      const result = await orderCollection.insertOne(order);
      // console.log(result);
      res.send(result);
    });

    // POST API FOR USERS
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    // get api for lipsticks
    app.get("/lipsticks", async (req, res) => {
      const query = req.query;
      console.log({ query });

      let filter = {};
      if (query.search) {
        filter = {
          $text: { $search: query.search },
        };
      }
      const cursor = lipsticksCollection.find(filter);
      const lipstick = await cursor.toArray();
      // console.log(lipstick)
      res.send(lipstick);
    });

    // GET API FOR REVIEW DATA
    app.get("/review", async (req, res) => {
      const cursor = reviewCollection.find({});
      const review = await cursor.toArray();
      // console.log(review)
      res.send(review);
    });

    // GET SINGLE DATA API
    app.get("/lipsticks/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id, 'get id');
      const query = { _id: ObjectId(id) };
      const singleLipstick = await lipsticksCollection.findOne(query);
      res.json(singleLipstick);
    });

    // UPDATE SINGLE LIPSTICK
    app.put("/lipsticks/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: ObjectId(id) };
      const singleLipstick = await lipsticksCollection.updateOne(query, {
        $set: body,
      });
      res.json(singleLipstick);
    });

    // GET API FOR MANAGE ALL ORDERS & MY ORDERS
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      if (email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const myOrders = await cursor.toArray();
        res.json(myOrders);
      } else {
        const cursor = orderCollection.find({});
        const orders = await cursor.toArray();
        res.json(orders);
      }
    });

    // GET API FOR ADMIN VERIFICATION
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role == "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // DELETE PRODUCTS FOR ADMIN
    app.delete("/lipsticks/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = { _id: ObjectId(id) };
      const result = await lipsticksCollection.deleteOne(query);
      // console.log(result)
      res.send(result);
    });

    // DELETE API FOR ORDERS
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      // console.log('going to delete na order', id);
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      // console.log(result)
      res.send(result);
    });

    // UPSERT FOR USERS
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // MAKE ADMIN
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      console.log("put users admin", user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    // await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  // res.send('Hello from supple smile server site!')
  res.send("sunos ni naki boyra tui");
});

app.listen(port, () => {
  console.log(`Hello from supple smile server running ${port}`);
});
