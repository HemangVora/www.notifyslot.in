
const request = require('request')
const async = require('async');
var nodemailer = require('nodemailer');

const mail = require('./mail')
module.exports.Calculate = (db) => {
  console.log('inside scheduled file')
  let rs = db.collection('users').find({ notify: true,isActive:true }).toArray(function (err, UserCollectionResult) {
    db.collection('district').find({}).toArray(function (err1, distresult) {
      if (err) throw err;
      if (err1) throw err1;
      //console.log(result)
      var today = new Date();
      today.setHours(today.getHours() + 5)
      today.setMinutes(today.getMinutes() + 30)
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
      let districtCenterMap = getDistrictWiseMap(distresult, today).then(function (value) {
        console.log("--------------------------------------------------------------")
        var currentdate = new Date();

        currentdate.setHours( currentdate.getHours() + 5)
        currentdate.setMinutes( currentdate.getMinutes() + 30)
        var options = { hour12: true };

        var current = currentdate.toLocaleString('en-IN', options);

        current = current.replace(/\//g, '-');

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
        for (let userDetail of UserCollectionResult) {
          


          function sendMail(mail,db) {

            return new Promise((resolve, reject) => {
              transporter.sendMail(mail, function (error, response) {
                if (error) {
                  console.log(error);
                  reject(error);
                } else {
                  console.log("Message sent: " + JSON.stringify(response));
                  
                  resolve(response);
                }

                //transport.close();
              });
            })
          }
          function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
          }
          if (value.get(userDetail.district + ":" + userDetail.age + ":" + userDetail.dose) != undefined) {

            emailPromiseArray.push(
              sendMail({
                from: 'support@notifyslot.in',
                to: userDetail.email,
                subject: `${capitalizeFirstLetter(userDetail.name)} Vaccination slots available in cowin`,
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
                  Hi ${capitalizeFirstLetter(userDetail.name)},<br>
                  <br>
                  We hope you and your family members are safe at home, In this tough time we all are together in this.<br><br>
            
                  Here is a list of vaccination centers that are having available vaccine slots on ${current}. Please get vaccinated soon.
                  <br>
                  <br>
                  <a href="https://www.cowin.gov.in/home" style="color:wheat;">Click Here</a> to book vaccination slots.
                  <br>
                  <br>
                  ${value.get(userDetail.district + ":" + userDetail.age + ":" + userDetail.dose)}
                </div>
                </div>
                
            
              <br>
              </div>
    <div style="bottom:0;position:absolute;">
    
              If you want to disable this Email notification <a style=""href='http://www.notifyslot.in/disable/${userDetail.email}'>Click Here</a></div>
              </div>
    
              `
              })
            )

          }
        }
    
        mail.sendMail(emailPromiseArray,db);
        console.log("--------------------------------------------------------------")
      },
        function (error) { console.log(error) });


    });

  });
  async function getDistrictWiseMap(data, today) {
    let myPromise = new Promise(function (myResolve, myReject) {
      let finalMap = new Map();
      let districtArray = []
      let urls = []

      function httpGet(url, callback) {
        let options = {
          url: url,
          headers: {
            //Host: 'cdn-api.co-vin.in',
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
          }, json: true
        };
        request(options,
          function (err, res, body) {
            callback(err, body);
          }
        );
      }

      for (let obj of data) {
        console.log("Making Url district id :: " + obj.district)
        districtArray.push(obj.district);
        let cowinUrl = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${obj.district}&date=${today}`
       console.log("Url :: "+cowinUrl) 
        urls.push(cowinUrl)
      }
      async.map(urls, httpGet, function (err, resp) {
        if (err) return console.log(err);

       // console.log(resp);

        if (resp.length > 0) {
          for (let i = 0; i < resp.length; i++) {
            //first loop for district wise centers array
            let centerArr = resp[i];
            let arr = centerArr.centers;
           // console.log(arr)

            if (arr != undefined && arr != [] && arr != null) {

              for (let cObj of arr) {


                let sessionArray = cObj.sessions;
                //console.log(sessionArray)
                sessionArray.filter(x => {

                  if (x.available_capacity > 0) {
                    if (x.available_capacity_dose1 > 0) {
                      if (finalMap.has(districtArray[i] + ":" + x.min_age_limit + ":Dose 1")) {
                        let str = finalMap.get(districtArray[i] + ":" + x.min_age_limit + ":Dose 1")
                        str += `<div style="border:1px solid white;height:250px;width:200px;padding:20px;float:left;"> => 
                        <b>Center Name :</b> ${cObj.name} <br> <b>Address :</b> ${cObj.address}, ${cObj.district},
                         ${cObj.state_name}<br><b>Date :</b>${x.date}<br> <b>Available Capacity :</b> ${x.available_capacity} <br>
                          Dose 1 Slots : ${x.available_capacity_dose1}<br> <b>Fee :</b> ${cObj.fee_type} <br>
                           <b>Age Group :</b> ${x.min_age_limit} <br> <b>Vaccine Type :</b> ${x.vaccine} </div>`;

                        finalMap.set(districtArray[i] + ":" + x.min_age_limit + ":Dose 1", str)
                      }
                      else {
                        let s1 = `<div style="border:1px solid white;height:250px;width:200px;padding:20px;float:left;"> => 
                        <b>Center Name :</b> ${cObj.name} <br> <b>Address :</b> ${cObj.address}, ${cObj.district},
                         ${cObj.state_name}<br><b>Date :</b>${x.date}<br> <b>Available Capacity :</b> ${x.available_capacity} <br>
                          Dose 1 Slots : ${x.available_capacity_dose1}<br> <b>Fee :</b> ${cObj.fee_type} <br>
                           <b>Age Group :</b> ${x.min_age_limit} <br> <b>Vaccine Type :</b> ${x.vaccine} </div>`;

                        finalMap.set(districtArray[i] + ":" + x.min_age_limit + ":Dose 1", s1)

                      }
                    }
                    if (x.available_capacity_dose2 > 0) {
                      if (finalMap.has(districtArray[i] + ":" + x.min_age_limit + ":Dose 2")) {
                        let str = finalMap.get(districtArray[i] + ":" + x.min_age_limit + ":Dose 2")
                        str += `<div style="border:1px solid white;height:250px;width:200px;padding:20px;float:left;"> => 
                        <b>Center Name :</b> ${cObj.name} <br> <b>Address :</b> ${cObj.address}, ${cObj.district},
                         ${cObj.state_name}<br><b>Date :</b>${x.date}<br> <b>Available Capacity :</b> ${x.available_capacity} <br>
                          <b>Dose 2 Slots :</b> ${x.available_capacity_dose2}<br> <b>Fee :</b> ${cObj.fee_type} <br>
                           <b>Age Group :</b> ${x.min_age_limit} <br> <b>Vaccine Type :</b> ${x.vaccine} </div>`;

                        finalMap.set(districtArray[i] + ":" + x.min_age_limit + ":Dose 2", str)
                      }
                      else {
                        let s1 = `<div style="border:1px solid white;height:250px;width:200px;padding:20px;float:left;"> => 
                        <b>Center Name :</b> ${cObj.name} <br> <b>Address :</b> ${cObj.address}, ${cObj.district},
                         ${cObj.state_name}<br><b>Date :</b>${x.date}<br> <b>Available Capacity :</b> ${x.available_capacity} <br>
                          <b>Dose 2 Slots :</b> ${x.available_capacity_dose2}<br> <b>Fee :</b> ${cObj.fee_type} <br>
                           <b>Age Group :</b> ${x.min_age_limit} <br> <b>Vaccine Type :</b> ${x.vaccine} </div>`;

                        finalMap.set(districtArray[i] + ":" + x.min_age_limit + ":Dose 2", s1)

                      }
                    }


                  }
                })
              }
              //console.log(finalMap)
              myResolve(finalMap)

              //return finalMap;
              //console.log("finalMap")
            }
          }
        }
      })
    })
    return await myPromise;
  }

}
