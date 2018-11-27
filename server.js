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

//redirect to index.
app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
    res.redirect('/login');
	} else {
    //res.status(200); doesn't work if add this
    //console.log("Login successfully");
    //console.log({name:req.session.username});
		res.render('index',{name:req.session.username});
	}
});

//render to login.
app.get('/login',function(req,res) {
  res.render('login');
});

//render to create account.
app.get('/createAccount',function(req,res) {
  res.render('createAccount');
});

//render to create restaurant.
app.get('/new',function(req,res) {
  res.render('new');
});

//render to read all restaurants.
app.get('/read',function(req,res) {
  res.render('read');
});

//render to read all restaurants.
app.get('/error',function(req,res) {
  res.render('error');
});

//create record in mongodb:collection(accounts)
app.post('/createAccount',function(req,res) {
  MongoClient.connect(mongourl, function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500,{"Content-Type":"text/plain"}); //render error msg
      res.end("MongoClient connect() failed!");
    }
    /*
    if (err !== null) {
      res.writeHead(500,{"Content-Type":"text/plain"}); //render error msg
      res.end("MongoClient connect() failed!");
      return
    }
    console.log("MongoClient connect() succeed!");
    */
    var r = {};
    r.name = req.body.name;
    r.password = req.body.password;
    db.collection('accounts').insertOne(r,function(err) {
      assert.equal(err,null);
      db.close();
      //console.log("insert was successful!");
      res.redirect('/');
    });
  });
});

//create record in mongodb:collection(restaurants)
app.post('/new',function(req,res) {
  var owner = req.session.name;
  if (req.body.name == "" || owner == "") {
    res.redirect('/error');
  } else {
    var form = new formidable.IncomingForm();
    console.log('test');
    console.log(form);
    form.parse(req, function (err, fields, files) {
      console.log('test2');
      console.log(JSON.stringify(files));
      var filename = files.filetoupload.path;
      if (fields.title) {
        var title = (fields.title.length > 0) ? fields.title : "untitled";
      }
      if (files.filetoupload.type) {
        var mimetype = files.filetoupload.type;
      }
      console.log("title = " + title);
      console.log("filename = " + filename);
      fs.readFile(filename, function(err,data) {
        MongoClient.connect(mongourl,function(err,db) {
          try {
            assert.equal(err,null);
          } catch (err) {
            res.writeHead(500,{"Content-Type":"text/plain"});
            res.end("MongoClient connect() failed!");
          }
          console.log("MongoClient connect() succeed!");
          var image = new Buffer(data).toString('base64');
          var r = {"name": fields.name, "borough": fields.borough, "photo": image, "photo_minetype": mimetype, 
              "address": {"street": fields.street, "building": fields.building, "zipcode": fields.zipcode, 
                        "coord": [fields.lon, fields.lat]}, 
              "grades": {"user": null, "score": null},
              "owner" : req.session.username
              };
          insertRestaurants(db,r,function(result) {
            db.close();
            res.redirect('/read');
          })
        })
      });
    });
  }
});

//check login.
app.post('/login',function(req,res) {
  MongoClient.connect(mongourl, function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500,{"Content-Type":"text/plain"}); //render error msg
      res.end("MongoClient connect() failed!");
    }
    var r = {};
    r.name = req.body.name;
    r.password = req.body.password;
    var cursor = db.collection('accounts').find(r);
    var result = [];
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
        result.push(doc);
      }
    }); 
    req.session.authenticated = true;
    req.session.username = r.name;
    res.redirect('/');
  });
});

//render to logout.
app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});

function insertRestaurants(db,r,callback) {
  db.collection('restaurants').insertOne(r,function(err,result) {
    assert.equal(err,null);
    console.log("insert was successful!");
    console.log(JSON.stringify(result));
    callback(result);
  });
}

app.listen(process.env.PORT || 8099); 