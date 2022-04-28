const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
// const ObjectId = require("mongodb").ObjectId;
// const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());

async function run() {
  try {
    //     await client.connect();
    //     const carsCollection = client.db("carsCollection").collection("cars");

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
  console.log(`Listening on port ${port}`);
});
