const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

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
    const myCollection = client.db("carsCollection").collection("myCars");

    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // Fetch all cars
    app.get("/cars", async (req, res) => {
      const query = {};
      const cars = await carsCollection.find(query).toArray();
      res.send(cars);
    });

    // Fetch a car by id
    app.get("/cars/:id", async (req, res) => {
      const carId = req.params.id;
      const query = { _id: ObjectId(carId) };
      const car = await carsCollection.findOne(query);
      res.send(car);
    });

    // Add a new car
    app.post("/cars", async (req, res) => {
      const email = req.body.email;
      const name = req.body.name;
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const supplier = req.body.supplier;
      const pic = req.files.image;
      const encodedPic = pic.data.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const car = {
        email,
        name,
        description,
        price,
        quantity,
        supplier,
        image: imageBuffer,
      };
      const newCar = await carsCollection.insertOne(car);
      res.send(newCar);
    });

    // Update a car
    app.put("/cars/:id", async (req, res) => {
      const carId = req.params.id;
      const car = req.body;
      const filter = { _id: ObjectId(carId) };
      const options = { upsert: true };
      const updatedInfo = {
        $set: {
          name: car.name,
          image: car.image,
          description: car.description,
          price: car.price,
          quantity: car.quantity,
          supplier: car.supplier,
        },
      };
      const updatedCar = await carsCollection.updateOne(
        filter,
        options,
        updatedInfo
      );
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
        const query = { email: email };
        const cursor = myCollection.find(query);
        const myItems = await cursor.toArray();
        res.send(myItems);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });
    app.post("/my-items", async (req, res) => {
      const email = req.body.email;
      const name = req.body.name;
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const supplier = req.body.supplier;
      const pic = req.files.image;
      const encodedPic = pic.data.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const inventory = {
        email,
        name,
        description,
        price,
        quantity,
        supplier,
        image: imageBuffer,
      };
      const result = await myCollection.insertOne(inventory);
      res.send(result);
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
