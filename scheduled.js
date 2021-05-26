
const request = require('request')
const async = require('async');
var nodemailer = require('nodemailer');

const mail = require('./mail')
module.exports.Calculate = (db) => {
  console.log('inside scheduled file')
  let rs = db.collection('users').find({ notify: true }).toArray(function (err, UserCollectionResult) {
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
        for (let userDetail of UserCollectionResult) {
          var transporter = nodemailer.createTransport({
            host: 'smtp.notifyslot.in',
            port:'587',
            secure: false,
            
            auth: {
              user: 'alert@notifyslot.in',
              pass: 'M#IPiJTZ2'
            },
            tls: {rejectUnauthorized: false, secureProtocol: "TLSv1_method" }
          });


          function sendMail(mail) {

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
                from: 'alert@notifyslot.in',
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
        //console.log(value)  
        mail.sendMail(emailPromiseArray, nodemailer);
        console.log("--------------------------------------------------------------")
      },
        function (error) { /* code if some error */ });

      // result.filter(x => { 
      //   if (uniqueId.has(x.district)) {
      //     let temp = uniqueId.get(x.district).get("users")
      //     temp.push({ name: x.name, email: x.email, age: x.age, dose: x.dose })
      //     let t1 = new Map();
      //     t1.set("users", temp)
      //     uniqueId.set(x.district, t1)
      //   }
      //   else {
      //     let t = new Map();
      //     t.set("users", [{ name: x.name, email: x.email, age: x.age, dose: x.dose }])
      //     uniqueId.set(x.district, t)
      //   }

      // })


      // function httpGet(url, callback) {
      //   const options = {
      //     url: url,
      //     json: true
      //   };
      //   request(options,
      //     function (err, res, body) {
      //       callback(err, body);
      //     }
      //   );
      // }
      // let urls = [];
      // let districtArray = []
      // for (let id of uniqueId.keys()) {
      //   console.log("Ping for district id :: " + id)
      //   districtArray.push(id);
      //   let cowinUrl = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${id}&date=${today}`
      //   urls.push(cowinUrl)
      // }
      // console.log(districtArray)

      // async.map(urls, httpGet, function (err, resp) {
      //   if (err) return console.log(err);

      //   //console.log(resp);

      //   // if (resp.length > 0) {
      //   //   for (let i = 0; i < resp.length; i++) {
      //   //     //first loop for district wise centers array
      //   //     let centerArr = resp[i];

      //   //     if (centerArr.centers.length > 0) {

      //   //       for (let cObj of centerArr.centers) {


      //   //         let sessionArray = cObj.sessions;
      //   //         //console.log(sessionArray)
      //   //         sessionArray.filter(x => {

      //   //           if (x.available_capacity > 0) {

      //   //             if (uniqueId.get(districtArray[i]).has("centerDetail")) {

      //   //               let ar = uniqueId.get(districtArray[i]).get("centerDetail");
      //   //               ar.push({
      //   //                 name: cObj.name, address: cObj.address,
      //   //                 state: cObj.state_name, district: cObj.district_name, block: cObj.block_name, stime: cObj.from,
      //   //                 etime: cObj.to, fee: cObj.fee_type, ageG: x.min_age_limit, vaccine: x.vaccine, date: x.date, capacity: x.available_capacity, dose1: x.available_capacity_dose1, dose2: x.available_capacity_dose2
      //   //               })

      //   //               let m1 = new Map();
      //   //               m1 = uniqueId.get(districtArray[i])
      //   //               m1.set("centerDetail", ar)
      //   //               uniqueId.set(districtArray[i], m1)

      //   //             }
      //   //             else {
      //   //               let m = new Map();
      //   //               m = uniqueId.get(districtArray[i])
      //   //               var t = [{
      //   //                 name: cObj.name, address: cObj.address,
      //   //                 state: cObj.state_name, district: cObj.district_name, block: cObj.block_name, stime: cObj.from,
      //   //                 etime: cObj.to, fee: cObj.fee_type, ageG: x.min_age_limit, vaccine: x.vaccine, date: x.date, capacity: x.available_capacity, dose1: x.available_capacity_dose1, dose2: x.available_capacity_dose2
      //   //               }]
      //   //               m.set("centerDetail", t);

      //   //               uniqueId.set(districtArray[i], m)
      //   //             }
      //   //           }
      //   //         })

      //   //       }

      //   //     }

      //   //   }
      //   //   // console.log(uniqueId)

      //   //  // mail.sendMail(uniqueId, nodemailer);
      //   //   //res.send(uniqueId);
      //   // }
      //   // array.push(resp)
      //   // console.log(array)

      // });



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
