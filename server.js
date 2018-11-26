var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var url = require('url');
var fs = require('fs');
var formidable = require('formidable');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectID = require('mongodb').ObjectID;

var mongourl = "mongodb://admin123:admin123@ds245532.mlab.com:45532/nicoletangsy";

app = express();
app.set('view engine','ejs');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
    res.redirect('/login');
	} else {
    //res.status(200);
    console.log("Login successfully");
    console.log({name:req.session.username});
		res.render('index',{name:req.session.username});
	}
});

app.get('/login',function(req,res) {
  res.render('login');
});

app.post('/createAccount',function(req,res) {
  MongoClient.connect(mongourl, function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500,{"Content-Type":"text/plain"}); //render error msg
      res.end("MongoClient connect() failed!");
    }
    console.log("MongoClient connect() succeed!");
    var r = {};
    r.name = req.body.name;
    r.password = req.body.password;
    db.collection('accounts').insertOne(r,function(err) {
      assert.equal(err,null);
      db.close();
      console.log("insert was successful!");
      res.redirect('/');
    });
  });
});

app.get('/createAccount',function(req,res) {
  res.render('createAccount');
});

app.post('/login',function(req,res) {
  MongoClient.connect(mongourl, function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500,{"Content-Type":"text/plain"}); //render error msg
      res.end("MongoClient connect() failed!");
    }
    console.log("MongoClient connect() succeed!");
    var r = {};
    r.name = req.body.name;
    r.password = req.body.password;
    console.log("Test1");
    var cursor = db.collection('accounts').find(r);
    var result = [];
    console.log("Test2");
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
        result.push(doc);
      }
    }); 
    req.session.authenticated = true;
    req.session.username = r.name;
    console.log("Test3");
    res.redirect('/');
  });
});


app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});

app.listen(process.env.PORT || 8099); 