const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
// const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());
app.use(fileUpload());

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
      const name = req.body.name;
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const supplier = req.body.supplier;
      const pic = req.files.image;
      const encodedPic = pic.data.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const car = {
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
  } finally {
    // client.close();
  }
}
run();

app.get("/", (req, res) => {
  res.send({
    products: {
      allProducts: "https://car-management.herokuapp.com/cars",
      specificProduct: {
        pattern: "https://car-management.herokuapp.com/cars/{_id}",
        example:
          "https://car-management.herokuapp.com/cars/6263a3f86375db50d03bd09a",
      },
    },
    maintainer: "Toufiq Hasan Kiron <kiron@mygsuite.co>",
    source: "Coming soon....",
  });
});

app.listen(port, () => {
  console.log(`Car Warehouse Management System Listening on port ${port}`);
});
