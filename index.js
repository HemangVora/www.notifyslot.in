const compression = require('compression')
const express = require('express')
const request = require('request')
const async = require('async');
const expressSession = require('express-session');
const expressVisitorCounter = require('express-visitor-counter');
const app = express()
var nodemailer = require('nodemailer');
const mail =require('./mail')
app.use(compression())

const path = require('path');
const schedule = require('node-schedule');
const bodyParser = require("body-parser");


port = process.env.PORT || 3000;

var mongoUtil = require('./connect');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())


 mongoUtil.connectToServer(function (err, client) {
  if (err) console.log(err);
  // start the rest of your app here
  var db = mongoUtil.getDb();
  const counters = db.collection('counters')
 
  app.set('view engine', 'ejs');

  //app.use(bodyParser.json());



  app.get('/', (req, res) => {
    // const job = schedule.scheduleJob('* * * * *', function () {
    //   console.log('The answer to life, the universe, and everything!' + new Date());
    // });
    // console.log("Done che")
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
    // console.log(insertObj)
    // console.log(req.body)
    

    try {
      let rs = db.collection('users').insertOne(insertObj);
      
      console.log(rs)
    } catch (e) {
      console.log(e);
    };
    return res.json({ "response": "Success" });
  })


  app.get('/startEmailService', (req, res) => {
    const job = schedule.scheduleJob('* * * * *', function () {
      console.log('Running scheduler for time ' + new Date());
      var db = mongoUtil.getDb();
      let rs = db.collection('users').find({}).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
      });
    });


    res.json({ 'success': 'true' })

  });
  app.get('/test', (req, res) => {
    //console.log('Running scheduler for time ' + new Date());
    console.log('/test called')
    var db = mongoUtil.getDb();
    let rs = db.collection('users').find({ notify: true }).toArray(function (err, result) {
      if (err) throw err;
      var today = new Date();
      var dd = today.getDate();

      var mm = today.getMonth() + 1;
      var yyyy = today.getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }

      if (mm < 10) {
        mm = '0' + mm;
      }

      today = dd + '-' + mm + '-' + yyyy;
      let uniqueId = new Map();
      result.filter(x => {
        if (uniqueId.has(x.District)) {
          let temp = uniqueId.get(x.District).get("users")
          temp.push({ name: x.name, email: x.email })
          let t1 = new Map();
          t1.set("users",temp)
          uniqueId.set(x.district, t1)
        }
        else {
          let t = new Map();
          t.set("users",[{ name: x.name, email: x.email }])
          uniqueId.set(x.district, t)
        }

      }) 
      console.log(uniqueId)
      
      function httpGet(url, callback) {
        const options = {
          url :  url,
          json : true
        };
        request(options,
          function(err, res, body) {
            callback(err, body);
          }
        );
      }
      let urls=[];
      let districtArray=[]
      for(let id of uniqueId.keys())
      {
        console.log("Ping for district id :: " + id)
       districtArray.push(id);
        let cowinUrl = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${id}&date=${today}`
        urls.push(cowinUrl)
      } 
     console.log(districtArray)
      
      async.map(urls, httpGet, function (err, resp){
        if (err) return console.log(err);
        
        //console.log(resp);
        
        if(resp.length>0){
          for(let i=0;i<resp.length;i++){
            //first loop for district wise centers array
            let  centerArr = resp[i];
            
            if(centerArr.centers.length>0){
              
              for(let cObj of centerArr.centers)
              {

                
                  let sessionArray = cObj.sessions;
                  //console.log(sessionArray)
                  sessionArray.filter(x =>{
                    
                    if(x.available_capacity>0)
                    {
                     
                      if(uniqueId.get(districtArray[i]).has("centerDetail")){
                        
                       let ar = uniqueId.get(districtArray[i]).get("centerDetail");
                       ar.push({name:cObj.name,address:cObj.address,
                        state:cObj.state_name,district:cObj.district_name,block:cObj.block_name,stime:cObj.from,
                        etime:cObj.to,fee:cObj.fee_type,ageG:x.min_age_limit,vaccine:x.vaccine,date:x.date,capacity:x.available_capacity,dose1:x.available_capacity_dose1,dose2:x.available_capacity_dose2})
                        
                        let m1= new Map();
                        m1=uniqueId.get(districtArray[i])
                        m1.set("centerDetail",ar)
                        uniqueId.set(districtArray[i],m1)
                        
                      }
                      else{
                        let m=new Map();
                        m=uniqueId.get(districtArray[i])
                        var t=[{name:cObj.name,address:cObj.address,
                          state:cObj.state_name,district:cObj.district_name,block:cObj.block_name,stime:cObj.from,
                          etime:cObj.to,fee:cObj.fee_type,ageG:x.min_age_limit,vaccine:x.vaccine,date:x.date,capacity:x.available_capacity,dose1:x.available_capacity_dose1,dose2:x.available_capacity_dose2}]
                        m.set("centerDetail",t);

                        uniqueId.set(districtArray[i],m)
                      }
                    }
                  })
                
              }
              
            }
            
          }
         // console.log(uniqueId)
         
         mail.sendMail(uniqueId,nodemailer);
     res.send(uniqueId);
        }
        // array.push(resp)
        // console.log(array)
      
      });
         
      
      

    });

  });
  app.get('/disable/:email',function(req,res){
   console.log(req.params.email)
   if(req.params.email.toString().indexOf("@")==-1 ||req.params.email.toString().indexOf(".")==-1)
   {
      res.render('error')
   }
   else{
   var myquery = { email: req.params.email };
  var newvalues = {$set: {notify: false} };
  var db = mongoUtil.getDb();
  db.collection("users").updateMany(myquery, newvalues, function(err, res) {
    if (err) throw err;
    console.log(res.result.nModified + " document(s) updated");
    
  });
}
  //  res.json({})
  })
  app.get('*',(req,res)=>res.render('error'))
  app.listen(port, () => {
    
    console.log(`Server listening on the port::${port}`);
  });
});