module.exports.sendMail = (emailPromiseArray, nodemailer) => {
  console.log("Entering SendMail Method Mail.js File")

      Promise.all(emailPromiseArray).then((result) => {
        console.log('all mail completed');
      }).catch((error) => {
        console.log(error);
      })
      
      console.log("Exit SendMail Method Mail.js File")
    }
 