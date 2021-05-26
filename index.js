const compression = require('compression')
const express = require('express')
const request = require('request')
const expressSession = require('express-session');
const expressVisitorCounter = require('express-visitor-counter');
var favicon = require('serve-favicon')
const app = express()

const scheduled = require('./scheduled')
var mongoUtil = require('./connect');

const path = require('path');
const schedule = require('node-schedule');
const bodyParser = require("body-parser");


port = process.env.PORT || 3000;
app.use(compression())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

mongoUtil.connectToServer(function (err, client) {
  if (err) console.log(err);
  // start the rest of your app here

  var db = mongoUtil.getDb();
  const counters = db.collection('counters')

  app.set('view engine', 'ejs');
  app.use(favicon(path.join(__dirname, 'favicon.ico')))




  app.get('/', (req, res) => {
    console.log('/called')
    res.render('index')
  });

  app.enable('trust proxy');
  app.use(expressSession({ secret: 'secret', resave: false, saveUninitialized: true }));
  app.use(expressVisitorCounter({ collection: counters }));
  app.get('/count', async (req, res, next) => res.json(await counters.find().toArray()));

  app.post('/captcha', (req, res) => {
    console.log("/captcha called")


    if (req.body.captcha === undefined || req.body.captcha === '' || req.body.captcha === null) {
      return res.json({ "response": "something goes to wrong" });
    }
    const secretKey = "6Lf-FNcaAAAAABPHmBpcwNI2i1ElSQmeijgwlIUF";

    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body.captcha + "&remoteip=" + req.connection.remoteAddress;

    request(verificationURL, function (error, response, body) {
      body = JSON.parse(body);
      console.log(body)
      if (body.success !== undefined && !body.success) {
        return res.json({ "response": "Failed captcha verification" });
      }
      return res.json({ "response": "Success" });
    });
  });

  app.post('/submit', (req, res) => {
    console.log('/submit called:');
    var insertObj = {};
    insertObj.notify = true;
    insertObj.name = req.body.Name;
    insertObj.email = req.body.Email;
    insertObj.district = req.body.District;
    insertObj.phone = req.body.Phone;
    insertObj.age = req.body.age;
    insertObj.dose = req.body.dose;

    // console.log(insertObj)
    // console.log(req.body)


    try {

	
	let rs = db.collection('users').insertOne(insertObj);
      let rs1 = db.collection('district').find({ district: insertObj.district }).toArray(function (err, result) {
        if (err) throw err;
        //console.log(result);
        if (result.length > 0) {
          let tarr = result[0].detail;
          tarr.push({ name: insertObj.name, email: insertObj.email, notify: insertObj.notify });
          var newvalues = { $set: { detail: tarr } };
          db.collection('district').updateOne({ district: insertObj.district }, newvalues, function (err, res) {
            if (err) throw err;
            console.log(res.result.nModified + " document updated");

          });
        }
        else {
          let arr = [{ name: insertObj.name, email: insertObj.email, notify: insertObj.notify }]
          db.collection('district').insertOne({ district: insertObj.district, detail: arr })
        }
      })

    } catch (e) {
      console.log(e);
    };
    return res.json({ "response": "Success" });
  })


  app.get('/startEmailService', (req, res) => {
    console.log('called /startEmailService')
    const job = schedule.scheduleJob('* * * * *', function () {
      console.log('Running scheduler for time ' + new Date());
      var db = mongoUtil.getDb();
      scheduled.Calculate(db);
    });
    res.status(200)
  });


  app.get('/disable/:email', function (req, res) {
    console.log(req.params.email)
    if (req.params.email.toString().indexOf("@") == -1 || req.params.email.toString().indexOf(".") == -1) {
      res.render('error')
    }
    else {
      var myquery = { email: req.params.email };
      var newvalues = { $set: { notify: false } };
      var db = mongoUtil.getDb();
      db.collection("users").updateMany(myquery, newvalues, function (err, relts) {
        if (err) throw err;
        console.log(relts.result.nModified + " document(s) updated");
        res.render('index')
      });
    }
    //  res.json({})
  })
  // app.get('*',(req,res)=>res.render('error'))
  app.listen(port, () => {

    console.log(`Server listening on the port::${port}`);
  });
});
