/*Coded by Niccolo Lampa. email:niccololampa@gmail.com */
/* TO SEE  ALL FEATURES PLEASE VIEW IN CODESANDBOX FULL/SCREEN ACTUAL MODE * /
/* PREVIEW MODE DOESN'T SHOW ALL FEATURES */
/* Run on http://localhost:8080/ after node index.js */

// for environment variables
require('dotenv/config');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

app.listen(8080);

const connection = mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true }
);

//SERVING STATIC ASSETS
app.use(express.static(__dirname + '/styling'));

//GETTING READY FOR POST REQUEST
app.use('/', bodyParser.urlencoded({ extended: false }));

// GET PROJECT INFO
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/project-info.html');
});

// CREATE  A COUNTER SCHEMA
const counterSchema = new Schema({
  _id: { type: String, required: true },
  current_count: Number
});

const Counters = mongoose.model('Counters', counterSchema);

// CREATE URL MODEL SCHEMA
// include count_id doing this is better than modifying mongoose generated id.
const urlSchema = new Schema({
  original_url: { type: String, required: true },
  count_id: { type: Number }
});

// PRE WILL RUN BEFORE SAVING A NEW URLSCHEMA DOCUMENT
// THis will insert a unique count_id based on counters model
urlSchema.pre('save', function(next) {
  var doc = this;
  Counters.findByIdAndUpdate(
    { _id: 'count_status' },
    { $inc: { current_count: 1 } },
    function(err, data) {
      if (err) return next(err);
      doc.count_id = data.current_count;
      next();
    }
  );
});

// upload to Urls Model to server
const Urls = mongoose.model('Urls', urlSchema);

// FUNCTION TO CHECK IF URL IS VALID
function validateUrl(url) {
  var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  if (pattern.test(url)) {
    return true;
  }
  return false;
}

//  PROCESS POST REQUEST. WHEN URL IS SUBMITTED
app.post('/api/shorturl/', (req, res) => {
  // get the url provided in form
  let urlProvided = req.body.urlInput;
  let id = null;

  // Check validty of url. If  is not valid
  if (validateUrl(urlProvided) === false) {
    return res.json({ error: 'invalid URL' });
  }

  // Chekc if url is already in the database

  Urls.findOne({ original_url: urlProvided }, (err, data) => {
    // if data is in database
    if (data) {
      let id = data.count_id.toString();
      let shorturl = req.get('host') + '/a/' + id;
      return res.send({ original_url: urlProvided, short_url: shorturl });
    }
    // if not create in database
    else {
      console.log('creating database ');

      // Upload submitted URL to Mongo database if url is valid
      const urlUploaded = new Urls({ original_url: urlProvided });
      urlUploaded.save((err, data) => {
        if (err) return console.log(err);
        else {
          // Once uploaded find the system generated ID of url. This will be used as the shortened url.
          Urls.findOne({ original_url: urlProvided }, (err, data) => {
            if (err) return console.log(err);

            if (data) {
              let id = data.count_id.toString();
              let shorturl = req.get('host') + '/a/' + id;
              const output = { original_url: urlProvided, short_url: shorturl };
              // return processed
              res.json(output);
            }
          });
        }
      });
    }
  });
});

// SHORT URL REDIRECTING TO ORIGINAL URL
app.get('/a/:urlInput', (req, res) => {
  const urlInput = req.params.urlInput;
  Urls.findOne({ count_id: urlInput }, (err, data) => {
    if (err) {
      return console.log(err);
    }

    if (data) {
      const orgUrl = data.original_url;

      // redirect must include 301 request and http://
      res.redirect(301, orgUrl);
    }
  });
});

/*Coded by Niccolo Lampa. Email: niccololampa@gmail.com */

// (DISREGARD) NOTES SCRATCH PURPOSES ONLY FOR FUTURE REFERENCE

// app.get('/test', (req, res) => {
// Counters.findOne({ _id: 'count_status' }, (err, data) => {
//   if (err) {
//     console.log('there is an error');
//     return console.log(err);s
//   }
//   if (data) {
//     const current_count = data.current_count;
//     console.log(current_count);
//     res.send('Counter is currently ' + current_count);
//   }
// });
// console.log(connection.getCollection('counters'));
// Counters.findOneAndUpdate(
//   { _id: 'count_status' },
//   { $inc: { current_count: 1 } },
//   { new: true },
//   function(err, data) {
//     if (err) {
//       callback(err);
//     } else {
//       console.log(data.current_count);
//     }
//   }
// );
// Counters.create({ _id: 'count_status', current_count: 1 }),
//   (err, data) => {
//     if (err) return console.log(err);
//   };
// });

// app.get('/test2', (req, res) => {});