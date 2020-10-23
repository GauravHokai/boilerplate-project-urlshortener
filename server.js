'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortId = require('shortid');
var validUrl = require('valid-url');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true});
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  console.log("we're connected!");
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
//model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});
const urlModel = mongoose.model("urlModel",urlSchema);

app.post("/api/shorturl/new", async function (req, res) {

  const urlCode = shortId.generate();
  if(!validUrl.isWebUri(req.body.url))
  {
    res.json({error: "invalid URL"});
  }
  else{
    try{
      let findOne = await urlModel.findOne({original_url: req.body.url});
      if(findOne)
      {
        res.json({original_url: findOne.original_url, short_url: findOne.short_url});
      }
      else{
        findOne = new urlModel({
          original_url: req.body.url,
          short_url: urlCode
        });
        await findOne.save();
        res.json({original_url: findOne.original_url, short_url: findOne.short_url});
      }
    }
    catch(err){
      console.error(err)
      res.status(500).json('Server erorr...')

    }
  }

});
app.get("/api/shorturl/:short", async (req, res)=>{
    let foundUrl = await urlModel.findOne({short_url: req.params.short});
    if(foundUrl)
    {
      res.redirect(foundUrl.original_url);
    }
    else{
      res.status(404).json('No URL found');
    }

});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
