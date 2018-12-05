// server.js
// where your node app starts

// init project
var G = require('gizoogle');
var Twitter = require('twitter');
var CronJob = require('cron').CronJob;
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//init Twitter client
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// init sqlite db
var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(function(){
  if (!exists) {
    db.run('CREATE TABLE Dreams (dream TEXT)');
    console.log('New table Dreams created!');
    
    // insert default dreams
    // db.serialize(function() {
    //   db.run('INSERT INTO Dreams (dream) VALUES ("Find and count some sheep"), ("Climb a really tall mountain"), ("Wash the dishes")');
    // });
  }
  else {
    console.log('Database "Dreams" ready to go!');
    db.each('Select * from Dreams', function(err, row) {
      if ( row ) {
        console.log('record:', row);
      }else{
        console.log('nothing here');
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// endpoint to get all the dreams in the database
// currently this is the only endpoint, ie. adding dreams won't update the database
// read the sqlite3 module docs and try to add your own! https://www.npmjs.com/package/sqlite3
app.get('/getDreams', function(request, response) {
  db.all('Select * from Dreams ORDER BY RANDOM() LIMIT 1;', function(err, rows) {
    response.send(JSON.stringify(rows));
  });
});

//global id, query variable is used to ensure that we don't get the same tweet twice
let id = '';
let q = ["%23inspirationalquote","%23inspirationalquotes","%23quotes","%23quote","%23moviequotes","%23happyquote","%23happyquotes","%23sadquote","%23smartquote","%23funnyquote","%23ghandiquotes","%23homersimpsonquotes","%23crazyquotes","%23macbethquote","%23shakespearequote","%23familyquote"];
let qNumber = Math.floor(Math.random() * (q.length + 1));

//promise to help with asyn http call
function getTweet(params){
  return new Promise(function(resolved, rejected) {
    client.get('search/tweets', params, function(error, tweets, response) {
      if(tweets.hasOwnProperty('statuses')){
        //console.log(tweets.statuses[0]);
        let tweet = tweets.statuses[0].text;
        let id = tweets.statuses[0].id;
        //console.log(tweet);
        if(tweet.indexOf('RT @') != -1){
           tweet = tweet.substr(tweet.indexOf(':')+2);
        }
        // console.log(tweet.indexOf('#'),tweet.length/2);
        // if(tweet.indexOf('#') != -1 && tweet.indexOf('#') > tweet.length/2){
        //    tweet = tweet.substr(0,tweet.indexOf('#'));
        // }
        if(tweet.indexOf('https://') != -1){
           tweet = tweet.substr(0,tweet.lastIndexOf('https://'));
        }
        if(tweet.indexOf('…') != -1){
           tweet = tweet.substr(0,tweet.lastIndexOf(' '));
        }
        G.string(tweet, function(error, translation) {
          resolved([translation,id]);
        });
      }
    });
  });
}
app.get('/wakeUp', async function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
  let params = {q: q[qNumber],count: 1,lang: 'en'};
  if(id != 0){
    params.max_id = id;
  }
  let tweet = await getTweet(params);
  id = tweet[1].toString();
  let temp = qNumber;
  while(temp == qNumber){
    temp = Math.floor(Math.random() * (q.length + 1));
  }
  qNumber = temp;
  console.log(id);
  console.log(tweet);
  let result = tweet[0];
  // if(result.indexOf('\n') != -1){
  //   result = result.replace('\n','');
  // }
  // if(result.indexOf("'") != -1){
  //   result = result.replace("'","");
  // }
  // if(result.indexOf('"') != -1){
  //   result = result.replace('"','');
  // }
  db.serialize(function() {
    db.run('INSERT INTO Dreams (dream) VALUES (?)', result);
  });
});

app.post('/api',(req,res)=>{
  if(req.body.hasOwnProperty('text')){
    G.string(req.body.text,(err,trans)=>{
      res.send(JSON.stringify([{dream:trans}]));
    });
  }else{
    db.all('Select * from Dreams ORDER BY RANDOM() LIMIT 1;', function(err, rows) {
      res.send(JSON.stringify(rows));
    });
  }
});

//cron job to keep app awake and populate db
new CronJob('*/4 * * * *', function() {
  console.log('in cron');
  request('https://g-tweets.glitch.me/wakeUp', function(error, response, body){
    console.log('in request');
    //stayingAlive!
  });
},null,true,'America/Los_Angeles');
// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});