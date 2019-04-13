const express = require('express');
const app = express();
const User = require('./user');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Filter = require('bad-words');
const auth = require('./auth');
const Clarifai = require('clarifai');



app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
});

const clarifai = new Clarifai.App({
  apiKey: process.env.CLARIFY_KEY, //API-key
});

app.get('/', (req, res) => {
  res.send({ message: 'Hello World!' });
});

app.get('/test', (req, res) => {
  res.send({ message: 'Hello World!' });
  console.log('test');
});

// Read  my profile
app.get('/me', auth, async (req, res) => {
  try {
    if (req.user) {
      return res.status(200).send(req.user);
    }
  } catch (err) {
    return console.log(err);
  }
});

// Read all users
app.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Read a profile
app.get('/users/:id', auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    }
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send();
  }
});

// Create User
app.post('/register', async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.password){
      return res.status(400).send({message: "Incorrect form submission"})
    }
    console.log('Register request received');
    const filter = new Filter();
    if (filter.isProfane(req.body.name) || filter.isProfane(req.body.email)) {
      return res.send({ message: 'Profanity is not allowed'});
    }
    const user = new User(req.body);
    const token = await user.generateToken();
    await user.save();
    res.status(201).send({
      user,
      token,
    });
    console.log(req.body.name+' Signed up successfully');
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

//Login
app.post('/login', async (req, res) => {
  try {
    if (!req.body.email || !req.body.password){
      return res.status(400).json("Incorrect form submission")
    }
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password,
    );
    const token = await user.generateToken();
    await user.save();
    console.log(' signed in successfully');
    res.status(200).send({
      user,
      token,
    });
  } catch (e) {
    res.status(400).send();
    console.log(e);
  }
});

//Logout
app.post("/signout", async (req, res) => {
  try {
    User.findByIdAndUpdate()
    // Grab array of current user's tokens
    console.log(req.user.tokens)
    req.user.tokens = []
    console.log(req.user.tokens)

    await req.user.save()
    res.send({token: "Token array emptied",
  message: "User signed out"})
console.log(req.user.name+ " has signed out")
  } catch (e) {
    res.status(500).send(e)
  }
});

//Update user
app.patch('/update', auth, async (req, res) => {
  const allowedUpdates = ['name', 'email', 'password'];
  // Object.keys returns array of Object's names
  const updates = Object.keys(req.body);
  // Check each key name is allowed
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update),
  );
  if (!isValidOperation) {
    return res.status(400).send({
      error: 'Invalid updates',
    });
  }
  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    if (!req.user) {
      return res.status(404).send();
    }
    console.log(req.user.name + ' updated in successfully');
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
});

app.post("/face", (req,res)=>{
  clarifai.models
  .predict(
    Clarifai.FACE_DETECT_MODEL,
    // Image URL
    req.body.input,
  ).then(data=>res.json(data))
  .catch(err=>res.status(400).json("unable to work with api"))
})

app.listen(process.env.PORT, () => {
  console.log('app is running on port '+ process.env.PORT);
});
