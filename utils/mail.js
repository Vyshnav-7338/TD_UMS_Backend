"use strict";
const nodemailer = require("nodemailer");
async function sendotp(toaddress, otp) {
  console.log(`send otp called ${toaddress}`)
  sendmail(toaddress, "Otp for resetting your password for your cuts account",
    `<b>Hi user,</b>
    <br><br>
    <p>Otp for resetting your password is </p>
    <h1>${otp}<h1>

    <h3>Never share your account's password to anyone</h3>
    <a href="https://cutssa.com">https://cutssa.com</a>
    <img src="https://cutssa.com/images/gallery/logo.png" style="width:500px;height:200px"/>
    

    <p>

    Please do not reply to this email. Emails sent to this address will not be answered.<br>

    Copyright © 2021 MUHAMMED BADR BIN SHAREEDAH AL ANAZI COMPANY . Al Baladiyah District, Hafr Al Batin , Saudi Arabia . All rights reserved.</p> 
`
  )
}
async function sendmail(toaddress, subject, content) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",//"smtp.ethereal.email",
    port: 465,//587,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "adminn@cutssa.com", // generated ethereal user
      pass: "H=8g;7VD6(H8=wWM", // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"CUTS" <adminn@cutssa.com>', // sender address
    to: toaddress, // list of receivers
    "subject": subject, // Subject line
    //text: "Hello world?", // plain text body
    html: content, // html body
  }).catch((err) => {
    console.log(err)
  });

  console.log("Message sent: %s", info.messageId);
}

module.exports = sendmail;
module.exports.rex = function (x, y) {
  sendotp(x, y)
};