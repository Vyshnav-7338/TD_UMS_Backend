const express = require('express');
const bodyParser = require('body-parser');
const myRouter = express.Router();
const { json } = require('body-parser');
const User = require("../models/User")
const RToken = require("../models/ResetToken")
var auth = require('../auth/authenticate');

var mail = require('../utils/mail')
var randomstring = require("randomstring");

//PASSWORD HASH
const bcrypt = require('bcrypt');
const { ObjectId } = require('bson');
const saltRounds = 10;

myRouter.use(bodyParser.json());
myRouter.route('/')
    .all((req, res, next) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        next();
    })
    .get((req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /getusercount');
    })
    .post(
        async (req, res, next) => {
            //var pwd = req.user["pwd"];
            var body = req.body;
            var email = body["email"];
            if (email == null) { res.status(500).send("enter email id"); return; }

            console.log(email)
            //account check
            var user = await User.find({ "email": email })
            if (user.length == 0) {
                res.send({ "code": -1, "message": "no accounts found" }); return;
            }
            else if (user.length > 1) {
                var myarr = [];
                for (var i in user) {
                    var item = user[i]
                    var temp = { "_id": item._id, "email": item.email, "name": item.name, "usertype": item.usertype }
                    myarr.push(temp)
                }
                res.json({ "code": 2, "message": "multi accounts found", "data": myarr }); return;
            }
            else {
                var useracc = user[0];
                var otp = randomstring.generate({
                    length: 6,
                    charset: 'numeric'
                });
                const pro = new RToken({ "otp": otp, "owner": useracc._id })
                await pro.save().catch((err) => {
                    console.log(err)
                    res.status(500).send(err); return;
                }).then(async (val) => {
                    //res.send(val);
                    console.log(`otp verification started ${otp}`)
                    mail.rex(email, otp)
                    res.json({ "code": 1, "message": "otp sent", "data": val._id });
                })
            }
        }).patch(
            async (req, res, next) => {
                var ip = req.socket.remoteAddress;
                var body = req.body;
                console.log(`inputs: ${JSON.stringify(body)}`)
                var token = body["token"];
                if (token == null || token == "undefined") { res.status(500).send("token missing"); return; }
                console.log(token)
                //account check
                var vobj = await RToken.findOne({ "_id": ObjectId(token) })
                if (vobj == null) {
                    res.send({ "code": -1, "message": "verification failed" }); return;
                }
                else {
                    if (vobj.status == false) {
                        console.log("======= blocked =========")
                        res.send({ "code": -1, "message": "verification blocked due to too many attempts" }); return;
                    }
                    else {
                        if (vobj["otp"] == body["otp"]) {
                            //response token is used to authorize next step - PUT - updating new password to server
                            var response_token = randomstring.generate({
                                length: 12,
                                charset: 'alphanumeric'
                            });
                            res.send({
                                "code": 1, "message": "verification success",
                                "data": response_token
                            })
                            vobj.updateOne({
                                "status": true, "attempts": vobj["attempts"] + 1,
                                "response_token": response_token, "ip": ip
                            }).catch((err) => {
                                console.log(err)
                                //res.status(500).send(err);return;
                            }).then((val) => {
                                console.log("updated stats")
                            })
                        }
                        else {

                            //this to prevent brute force attack
                            if (vobj["attempts"] < 3) {
                                console.log("======= attempet + =========")
                                await vobj.updateOne({ "attempts": vobj["attempts"] + 1, "ip": ip }).catch((err) => {
                                    console.log(err)
                                    //res.status(500).send(err);return;
                                }).then((val) => {
                                    console.log("updated stats")
                                    res.send({ "code": -1, "message": "verification failed" })
                                })
                            }
                            else {
                                console.log("======= status false =========")
                                await vobj.updateOne({ "status": false }).then((val) => {
                                    console.log("updated stats" + JSON.stringify(val))
                                    res.send({ "code": -1, "message": "verification failed" })
                                })
                            }
                            //RToken.deleteOne({"_id":ObjectId(token)})
                        }
                    }
                }
            }).put(
                async (req, res, next) => {
                    var ip = req.socket.remoteAddress;
                    var body = req.body;
                    console.log(`inputs: ${JSON.stringify(body)}`)
                });
module.exports = myRouter