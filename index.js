//  Dependencies
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyparser = require('body-parser');

//  MongoDB Atlas Connection URI
const uri = process.env.MONGO_URI;

//  I  will remove this later
app.use(cors())

//  Providing HTML/CSS for the Site
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Middleware to parse the request body
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

// Mongoose Connect
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

// Users Schema
const users = new mongoose.Schema({
  username: String
});

// Exercise Schema
const exercise = new mongoose.Schema({
  id: String,
  username: String,
  description: String,
  duration: Number,
  date: String
});

// Log Schema
const log = new mongoose.Schema({
  id: String,
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
});

// Model Creation from schemas
const Users = mongoose.model('Users', users);
const Exercise = mongoose.model('Exercise', exercise);
const Log = mongoose.model('Log', log);


// API Endpoint for creating new user
app.post("/api/users",  async(req, res) => {

  // fetching username from Frontend form
  const username = req.body.username;
  try {
    // async function to block code till promise is recieved for successful creation of user
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


app.get("/api/users", async(req, res) => {
  try {
    // Query the "users" collection to retrieve the usernames
    const users = await Users.find({}, 'username');

    // Extract the usernames from the query result
    res.json(users);

  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const options = { 
  weekday: 'short', 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric' 
};

app.post("/api/users/:_id/exercises", async(req, res) => {
  const _id = req.params._id;
  // const _id = req.body._id;
  const { description } = req.body;
  const duration = parseInt(req.body.duration);
  let date =  req.body.date;

  const {username} = await Users.findById(_id);

  if (date === '') {

    date = new Date();
    // var formatteddate = date.toLocaleDateString('en-US', options);
    var formatteddate = date.toDateString();
    
  } else {
    date = new Date(date);
    // var formatteddate = date.toLocaleDateString('en-US', options);
    var formatteddate = date.toDateString();
  }

  try {
    await Exercise.create({
      id: _id,
      username: username,
      description: description,
      duration: duration,
      date: formatteddate
    });

    const response = {
      _id:_id,
      username: username,
      date: formatteddate,
      duration: duration,
      description: description,
    };
    
    res.json(response);

    const inlog = await Log.findOne({id:_id});
    if (!!inlog) {
      const counter = inlog.count;
      const updatedcounter = (counter + 1);
      await Log.findOneAndUpdate({id:_id}, {count: updatedcounter}, {new: true});
      await Log.updateOne({id:_id}, {$push: {log: {
        description: description,
        duration: duration,
        date: formatteddate,
      }
    }
  });

    } else {
      await Log.create({
        id: _id,
        username: username,
        count: 1,
        log: [{
          description: description,
          duration: duration,
          date: formatteddate,
        }]
      });
    }


  } catch (error) {
    res.json("error");
    console.error('An error occurred:', error); 
  }

});


app.get("/api/users/:_id/logs", async(req, res) => {
  const {_id } = req.params;
  const logobj = await Log.findOne({id:_id});

  const response = {
    _id:_id,
    username: logobj.username,
    count: logobj.count,
    log: logobj.log
  }
  res.json(response);
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});