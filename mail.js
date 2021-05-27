var mongoUtil = require('./connect');

module.exports.sendMail = (emailPromiseArray, nodemailer) => {
  console.log("Entering SendMail Method Mail.js File")

      Promise.all(emailPromiseArray).then((result) => {
        console.log(result)
        var db =mongoUtil.getDb();
        let acceptedArr =[];
        if(result.length>0){
          for(let obj of result){
            if(obj.accepted!=undefined){
              acceptedArr.push(obj.accepted[0])
            }
          }
          console.log(acceptedArr)
          var newvalues = { $set: { notify: false } }
          db.collection('users').updateMany({email: { $in: acceptedArr}}, newvalues, function (err, res) {
            if (err) throw err;
            console.log(res.result.nModified + " document updated");
  
          });
        }
        
        console.log('all mail completed');
      }).catch((error) => {
        console.log(error);
      })
      
      console.log("Exit SendMail Method Mail.js File")
    }
 