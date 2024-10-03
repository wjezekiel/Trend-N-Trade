const {ObjectId} = require("mongodb")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.getUsers = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection('user').find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const user = await db.collection('user').findOne({ _id: new ObjectId(req.query._id) });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.createUser = async (req, res) => {
  //console.log('called');

  try {
    const db = req.app.locals.db;
    const { firstName, lastName, email, username, password } = req.body;

    // Check if user email already exists
    const user = await db.collection('user').findOne({ email: email });
    if (user) {
      return res.status(401).json({ error: 'User already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Construct the new user object
    const newUser = {
      _id: new ObjectId(), // Generate a new ObjectId for the user
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword, // Store the hashed password
      rating: 10, // Default rating as per your example
      description: '', // Default empty description
      instagram: '', // Default empty social media links
      twitter: '',
      facebook: '',
      pfp: '', // Default empty profile picture
      tags: [], // Empty array for tags
      purchases: [], // Empty array for purchases
      saves: [],
      card: []
    };
    
    // Insert the new user into the database
    const result = await db.collection('user').insertOne(newUser);
    // Respond with the created user object
    res.status(201).json(result);
  } catch (err) {
    console.log(err);
    // Handle any errors
    res.status(400).json({ error: err.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    console.log("called");
    const db = req.app.locals.db;
    const { email, password } = req.body;
    
    console.log(email);

    const user = await db.collection('user').findOne({ email: email });
    if (!user) {
      console.log("user not found");
      return res.status(401).json({ error: 'Invalid username or password' });
      
    }

    console.log("user found");
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("invalid password");
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    console.log(token);

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.retrievePurchases = async (req, res) => {
  try {
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

    const purchases = user.purchases || [];
    if (purchases.length === 0) {
      return res.status(200).json([]);
    }

    const listings = await db.collection('listing').find({ _id: { $in: purchases.map(id => new ObjectId(id)) } }).toArray();

    

    const purchaseDetails = listings.map(listing => ({
      id: listing._id,
      image: listing.images[0],
      name: listing.name,
      listingPrice: listing.listingPrice,
      purchaseStatus: listing.purchaseStatus
    }));

    console.log(purchaseDetails);

    res.status(200).json(purchaseDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.retrieveSaves = async (req, res) => {
  try {
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

    const saves = user.saves || [];
    if (saves.length === 0) {
      return res.status(200).json([]);
    }

    const listings = await db.collection('listing').find({ _id: { $in: saves.map(id => new ObjectId(id)) } }).toArray();

    const savesDetails = listings.map(listing => ({
      id: listing._id,
      image: listing.images[0],
      name: listing.name,
      listingPrice: listing.listingPrice,
      purchaseStatus: listing.purchaseStatus
    }));

    console.log(savesDetails);

    res.status(200).json(savesDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.retrieveSales = async (req, res) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      console.log("Authorization header is missing");
      return res.status(401).json({ error: 'Authorization header is missing' });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: 'No token provided' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token successfully decoded');
    } catch (err) {
      console.log('Invalid token:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.userId;
    const db = req.app.locals.db;
    const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const listings = await db.collection('listing').find({ listingUserId: userId }).toArray();
    const purchaseDetails = listings.map(listing => ({
      id: listing._id,
      image: listing.images[0],
      name: listing.name,
      listingPrice: listing.listingPrice,
      purchaseStatus: listing.purchaseStatus
    }));

    res.status(200).json(purchaseDetails);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getLoggedInUser = async (req, res) => {
  try {

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

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCreditInfo = async (req, res) => {
  const { cardholderName, cardNumber, expirationDate, cvc } = req.body;
  console.log("card function called");
  console.log({ cardholderName, cardNumber, expirationDate, cvc });

  try {
    // Get the token from the authorization header
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.userId;
    const db = req.app.locals.db;

    // Prepare the new card information
    const newCard = [
      cardholderName,
      cardNumber,
      expirationDate,
      cvc
    ];

    // Use findOneAndUpdate to add the new card to the user's card array
    const updatedUser = await db.collection('user').findOneAndUpdate(
      { _id: new ObjectId(userId) }, // Filter: find user by ID
      { $push: { card: newCard } }, // Update: add the new card to the card array
      { returnOriginal: false } // Options: return the updated document
    );

    res.status(200).json({ message: 'Credit card information updated successfully', user: updatedUser.value });
  } catch (error) {
    console.error('Error updating credit card information:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { username, description, tags, instagram, twitter, facebook } = req.body;

  try {
    // Find the user by their username or ID (assuming you use a token and extract the user ID)
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.userId;
    const db = req.app.locals.db;

    // Prepare update object with only the fields that are provided in the request body
    const updateFields = {};
    if (username) updateFields.username = username;
    if (description) updateFields.description = description;
    if (tags) updateFields.tags = tags;
    if (instagram) updateFields.instagram = instagram;
    if (twitter) updateFields.twitter = twitter;
    if (facebook) updateFields.facebook = facebook;

    // Use findOneAndUpdate to update the user
    const updatedUser = await db.collection('user').findOneAndUpdate(
      { _id: new ObjectId(userId) }, // Filter: find user by ID
      { $set: updateFields }, // Update: set the fields specified in updateFields
      { returnOriginal: false } // Options: return the updated document
    );


    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser.value });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getCardInfo = async (req, res) => {
  try {
    // Get the token from the authorization header
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.userId;
    const db = req.app.locals.db;

    // Find the user by their ID
    const user = await db.collection('user').findOne(
      { _id: new ObjectId(userId) }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user's card information
    res.status(200).json({ message: 'Card information retrieved successfully', cards: user.card });
  } catch (error) {
    console.error('Error retrieving card information:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeCardInfo = async (req, res) => {
  try {
    // Get the token from the authorization header
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.userId;
    const db = req.app.locals.db;

    // Get the card index from the request body
    const { cardIndex } = req.body;

    // Update the user's document by removing the card at the specified index
    const user = await db.collection('user').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $unset: { [`card.${cardIndex}`]: 1 } },
      { returnOriginal: false }
    );

    // Remove any null values from the array after unsetting the specific card
    await db.collection('user').updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { card: null } }
    );

    res.status(200).json({ message: 'Card information removed successfully', cards: user.card });
  } catch (error) {
    console.error('Error removing card information:', error);
    res.status(500).json({ message: 'Server error' });
  }
};