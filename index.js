const compression = require('compression')
const express = require('express')
const request = require('request')
const expressSession = require('express-session');
const expressVisitorCounter = require('express-visitor-counter');
var favicon = require('serve-favicon')
const mail = require('./mail')
const app = express()

const scheduled = require('./scheduled')
var mongoUtil = require('./connect');

const path = require('path');
const schedule = require('node-schedule');
const bodyParser = require("body-parser");
let emailPromiseArray = [];
var transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 1,
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "AKIA5I5Z7ZLKXDHPA66D", // generated ethereal user
    pass: "BBCo/xEdvuD4C53w4eF+cBGSx+S+i39UFxZpNBajOyvG", // generated ethereal password
  }
});
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
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
    insertObj.isActive=true;
    
    emailPromiseArray.push(
      sendMail({
        from: 'support@notifyslot.in',
        to: insertObj.email,
        subject: `ThankYou For Registration in NotifySlot.in`,
        html: `<style>
      .even {
        background: transparent !important;
        color: white !important;
      }
    .im{
      color:white !important;
    }
      thead {
        color: #FFFFFF;
        font-family: Arial, sans-serif;
    
      }
    
      th {
        font-weight: 300 !important;
      }
    
      .even>.sorting_1 {
        background: transparent !important;
        color: white !important;
      }
    
      .odd>.sorting_1 {
        background: transparent !important;
        color: white !important;
      }
    
      .odd {
        background: transparent !important;
        color: white !important;
      }
    </style>
    
    <div class="container-fluid" style="height:100%;overflow:scroll;padding:20px;background: linear-gradient(to top left, #3a6186, #89253e);color:white;height:100% 
      !important;">
      <div class="row">
        <div class="col-lg-12">
          <h4 style="font-weight:400 !important;">
            <a class="" style="color: #FFFFFF;
                      font-family: Arial, sans-serif;
                    ">NotifySlot.in - The Co-WIN Slot Notifier <i class="fa fa-bell" aria-hidden="true"></i></a>
          </h4><br><br>
        </div>
      </div>
    
      <div class="row">
        <div class="col-lg-12">
          Hi ${capitalizeFirstLetter(insertObj.name)},<br>
          <br>
          We hope you and your family members are safe at home, In this tough time we all are together in this.<br><br>
    
          ThankYou for registering in notifyslot.in, we will mail you as soon as slots are available in cowin portal.
          <br>
        </div>
        </div>
        
    
      <br>
      </div>
<div style="bottom:0;position:absolute;">

      </div>

      `
      })
    )


    try {

	
	let rs = db.collection('users').insertOne(insertObj);
      let rs1 = db.collection('district').find({ district: insertObj.district }).toArray(function (err, result) {
        if (err) throw err;
        //console.log(result);
        mail.sendMail(emailPromiseArray,db);
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
    const job = schedule.scheduleJob('*/3 * * * *', function () {
      console.log('Running scheduler for time ' + new Date());
      var db = mongoUtil.getDb();
      scheduled.Calculate(db);
    });
    res.status(200)
  });
  app.get('/updateNotifyStatus', (req, res) => {
    console.log('called /updateNotifyStatus')
    const job = schedule.scheduleJob('0 1 * * *', function () {
      console.log('Running scheduler for updateNotifyStatus  time ' + new Date());
      var db = mongoUtil.getDb();
      var myquery = { notify:false };
      var newvalues = { $set: { notify: true} };
      db.collection("users").updateMany(myquery, newvalues, function (err, relts) {
        if (err) throw err;
        console.log(relts.result.nModified + " document(s) updated");
      
      });
    });
    res.status(200)
  });
  app.get('/setIsActive', (req, res) => {
    console.log('called /setIsActive')
      var db = mongoUtil.getDb();
      var myquery = { notify:true };
      var newvalues = { $set: { isActive: true} };
      db.collection("users").updateMany({}, newvalues, function (err, relts) {
        if (err) throw err;
        console.log(relts.result.nModified + " document(s) updated");
      })
  });
app.get('/sitemap.xml', function(req, res) {
  res.sendFile(__dirname + '/sitemap.xml');
  });
  app.get('/disable/:email', function (req, res) {
    console.log(req.params.email)
    if (req.params.email.toString().indexOf("@") == -1 || req.params.email.toString().indexOf(".") == -1) {
      res.render('error')
    }
    else {
      var myquery = { email: req.params.email };
      var newvalues = { $set: { notify: false,isActive:false } };
      var db = mongoUtil.getDb();
      db.collection("users").updateMany(myquery, newvalues, function (err, relts) {
        if (err) throw err;
        console.log(relts.result.nModified + " document(s) updated");
        res.render('index')
      });
    }
    //  res.json({})
  })
   app.get('*',(req,res)=>res.render('error'))
  app.listen(port, () => {

    console.log(`Server listening on the port::${port}`);
  });
});
