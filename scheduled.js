
const express = require('express')
const request = require('request')
const async = require('async');
var nodemailer = require('nodemailer');

const mail =require('./mail')
module.exports.Calculate=(db)=>{
    console.log('inside scheduled file')
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
       //res.send(uniqueId);
          }
          // array.push(resp)
          // console.log(array)
        
        });
           
        
        
  
      });
}