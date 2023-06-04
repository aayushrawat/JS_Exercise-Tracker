const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyparser = require('body-parser');

const uri = process.env.MONGO_URI;

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Middleware to parse the request body
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

// Event handlers for connection status
db.on('connected', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});


const users = new mongoose.Schema({
  username: String
});

const exercise = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});

const log = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
});

const Users = mongoose.model('Users', users);
const Exercise = mongoose.model('Exercise', exercise);
const Log = mongoose.model('Log', log);


app.post("/api/users",  async(req, res) => {

  const username = req.body.username;
  try {

    await Users.create({
      username:username
    });
    const respo = await Users.findOne({username: username});

    if (respo) {
      res.json({username: respo.username, _id: respo._id});
    } else {
      res.status(404).send('Record Not found');
    }

  } catch (error) {

    console.log("Failed to insert URL");
    console.log(error);

  }
});





















const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});