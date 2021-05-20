module.exports.sendMail = (map, nodemailer) => {
  console.log("Entering SendMail Method Mail.js File")
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'dharm.joshi9899@gmail.com',
      pass: 'Aer0PlanE@89'
    }
  });

  for (let id of map.keys()) {

    let temp = map.get(id).get("users")
    console.log()
    if (map.get(id).get("centerDetail") != undefined) {
      var appendhtml = "";
      let c = 1;
      for (let centerObj of map.get(id).get("centerDetail")) {
        console.log(centerObj)
        appendhtml += `<div style="border:1px solid white;height:250px;width:200px;padding:20px;float:left;"> ${c}) Center Name : ${centerObj.name} <br> Address : ${centerObj.address}, ${centerObj.district}, ${centerObj.state}<br>Date :${centerObj.date}<br> Available Capacity : ${centerObj.capacity} <br> Dose 1 Slots : ${centerObj.dose1}<br> Dose 2 Slots : ${centerObj.dose2}<br> Fee : ${centerObj.fee} <br> Age Group : ${centerObj.ageG} <br> Vaccine Type : ${centerObj.vaccine} </div>`
        c = c + 1;
      }

      for (let obj of temp) {
        //console.log(map.get(id).get("centerDetail"))
        console.log("Starting to send mail for id " + id)
        //console.log(obj)
        var currentdate = new Date();


        var options = { hour12: true };

        var current = currentdate.toLocaleString('en-IN', options);

        current = current.replace(/\//g, '-');



        var mailOptions = {
          from: 'dharm.joshi9899@gmail.com',
          to: obj.email,
          subject: 'Sending Email using Node.js',
          html: `<style>
                  .even {
                    background: transparent !important;
                    color: white !important;
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
                <div>
                
                </div>
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
                      Hi ${obj.name},<br>
                      <br>
                      We hope you and your family members are safe at home, In this tough time we all are together in this.<br><br>
                
                      Here is a list of vaccination centers that are having available vaccine slots on ${current}. Please get vaccinated soon.
                      <br>
                      <br>
                      ${appendhtml}
                    </div>
                  </div>
                
                  <br>
                
                </div>
                If you want to disable this Email notification <a href='http://localhost:3000/disable/${obj.email}'>Click Here</a>
                `
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
    }
  }
  console.log("Entering SendMail Method Mail.js File")


}
