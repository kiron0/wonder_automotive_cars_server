const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cars-warehouse.noktp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const carsCollection = client.db("carsCollection").collection("cars");

    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // Fetch all cars
    app.get("/cars", verifyJWT, async (req, res) => {
      const query = {};
      const cars = await carsCollection.find(query).toArray();
      res.send(cars);
    });

    // Fetch a car by id
    app.get("/cars/:id", verifyJWT, async (req, res) => {
      const carId = req.params.id;
      const query = { _id: ObjectId(carId) };
      const car = await carsCollection.findOne(query);
      res.send(car);
    });

    // Add a new car
    app.post("/cars", async (req, res) => {
      const car = req.body;
      const newCar = await carsCollection.insertOne(car);
      res.send(newCar);
    });

    // Update a car
    app.put("/cars/:id", async (req, res) => {
      const carId = req.params.id;
      const car = req.body;
      const query = { _id: ObjectId(carId) };
      const updatedCar = await carsCollection.updateOne(query, { $set: car });
      res.send(updatedCar);
    });

    // Delete a car
    app.delete("/cars/:id", async (req, res) => {
      const carId = req.params.id;
      const query = { _id: ObjectId(carId) };
      const deletedCar = await carsCollection.deleteOne(query);
      res.send(deletedCar);
    });

    app.get("/my-items", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const myItems = await carsCollection.find({ email: email }).toArray();
        res.send(myItems);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });
  } finally {
    // client.close();
  }
}
run();

app.get("/", (req, res) => {
  res.send({
    products: {
      allProducts: "https://cars-warehouse.herokuapp.com/cars",
      specificProduct: {
        pattern: "https://cars-warehouse.herokuapp.com/cars/{_id}",
        example:
          "https://cars-warehouse.herokuapp.com/cars/6263a3f86375db50d03bd09a",
      },
    },
    maintainer: "Toufiq Hasan Kiron <kiron@mygsuite.co>",
    source: "Coming soon....",
  });
});

app.listen(port, () => {
  console.log(`Car Warehouse Management System Listening on port ${port}`);
});
