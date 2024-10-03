const {ObjectId} = require("mongodb");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.getListings = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const listings = await db.collection('listing').find().toArray();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const listing = await db.collection('listing').findOne({_id: new ObjectId(req.body._id)})
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.search = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const searchTerm = req.body.search;
    console.log(req.body);
    const listings = await db.collection('listing').find({ name: { $regex: searchTerm, $options: 'i' } }).toArray();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


exports.createListing = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  //console.log(token);

  if (!token) {
    console.log("no token");
    return res.status(401).json({ error: 'No token provided' });
  }


  let decodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('token success');
  } catch (err) {
    console.log('invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = decodedToken.userId;
  console.log(userId);
  const db = req.app.locals.db;
  const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const db = req.app.locals.db;
    const newListing = req.body;

    const token = req.headers.authorization.split(' ')[1];
    //console.log(token);

    if (!token) {
      console.log("no token");
      return res.status(401).json({ error: 'No token provided' });
    }


    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
      console.log('token success');
    } catch (err) {
      console.log('invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }


    const userId = decodedToken.userId;

    newListing.listingUserId = new ObjectId(userId);
    
    newListing._id = new ObjectId();
    newListing.listingUserId = userId;

    await db.collection('listing').insertOne(newListing);
    res.status(201).json({newListing, ok: true});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateListingStatus = async (req, res) => {
  const { id, purchaseStatus } = req.body;

  const updateFields = {};
    if (purchaseStatus) updateFields.purchaseStatus = purchaseStatus;


  try {

    
    const db = req.app.locals.db;
    const updatedListing = await db.collection('listing').findOneAndUpdate(
      { _id: new ObjectId(id) }, // Filter: find user by ID
      { $set: updateFields }, // Update: set the fields specified in updateFields
      { returnOriginal: false } // Options: return the updated document
    );


    res.status(200).json({ message: 'Listing updated successfully', listing: updatedListing.value });

  } catch (error) {
    console.error('Error updating listings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.checkoutListing = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { listingId } = req.body;

    const token = req.headers.authorization.split(' ')[1];
    //console.log(token);

    if (!token) {
      console.log("no token");
      return res.status(401).json({ error: 'No token provided' });
    }


    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
      console.log('token success');
    } catch (err) {
      console.log('invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }


    const userId = decodedToken.userId;

    // Update listing purchase status
    const updatedListing = await db.collection('listing').findOneAndUpdate(
      { _id: new ObjectId(listingId) }, // Find listing by ID
      { $set: { purchaseStatus: 'purchased' } }, // Update purchaseStatus field
      { returnOriginal: false } // Return the updated document
    );

    // Add listingId to user's purchases array
    const updatedUser = await db.collection('user').findOneAndUpdate(
      { _id: new ObjectId(userId) }, // Find user by ID
      { $push: { purchases: new ObjectId(listingId) } }, // Add listingId to purchases array
      { returnOriginal: false } // Return the updated document
    );

    res.status(201).json({ message: 'Listing purchased successfully', ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getListingCheckout = async (req, res) => {
  const { listingId } = req.body;

  try {
    // Fetch listing data from MongoDB
    const db = req.app.locals.db;
    const listingData = await db.collection('listing').findOne({ _id: new ObjectId(listingId) });

    if (!listingData) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Extract necessary fields
    const { images, name, listingPrice } = listingData; // Note: images is now correctly assigned

    // Assuming images is an array and you want the first image
    const firstImage = images && images.length > 0 ? images[0] : '';

    res.status(200).json({ image: firstImage, name, listingPrice });
  } catch (error) {
    console.error('Error fetching listing data:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.saveListing = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  //console.log(token);

  if (!token) {
    console.log("no token");
    return res.status(401).json({ error: 'No token provided' });
  }


  let decodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('token success');
  } catch (err) {
    console.log('invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = decodedToken.userId;

  try {
    const db = req.app.locals.db;
    const listingId = req.body._id
    db.collection('user').findOneAndUpdate(
        { _id: new ObjectId(userId) }, // Find listing by ID
        { $push: { saves: listingId} }, // Update purchaseStatus field
        { returnOriginal: false } // Return the updated document
    )
    res.json({ok: true});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}