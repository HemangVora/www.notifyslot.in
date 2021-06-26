
var newvalues = { $set: { notify: false } }
module.exports.sendMail = (emailPromiseArray, db) => {
  console.log("Entering SendMail Method Mail.js File")

      Promise.all(emailPromiseArray).then((result) => {
        console.log(result)
     
        let acceptedArr =[];
        if(result.length>0){
          for(let obj of result){
            if(obj.accepted!=undefined){
              acceptedArr.push(obj.accepted[0])
            }
          }
          console.log(acceptedArr)
          
        }
        updateDb(acceptedArr,db).then(function(rows) {
          console.log("u")
      }).catch((err) => setImmediate(() => { throw err; }));
        console.log('all mail completed');
      }).catch((error) => {
        console.log(error);
      })
      
      console.log("Exit SendMail Method Mail.js File")
    }
 function updateDb(acceptedArr1,db){

  return new Promise(function(resolve,reject){

    db.collection('users').updateMany({email: { $in: acceptedArr1}}, newvalues, function (err, res) {
      if (err)  return reject(err);;
      console.log(res.result.nModified + " document updated");
      resolve(res);
    });
  })
 }