const mongoose = require("mongoose");
const Listing = require("./models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function verify() {
  try {
    await mongoose.connect(MONGO_URL);
    const count = await Listing.countDocuments();
    console.log(`Total listings in database: ${count}`);
    
    const sample = await Listing.findOne();
    if (sample) {
      console.log(`Sample listing title: ${sample.title}`);
      console.log(`Sample listing object ID: ${sample._id}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

verify();
