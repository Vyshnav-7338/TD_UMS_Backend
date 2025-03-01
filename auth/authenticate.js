
var jwt = require('jsonwebtoken');
//var con = require('../utils/dbconnect');
var passport = require("passport");
var passportJWT = require("passport-jwt");
var config = require('../config');
//var mongoUtil = require( './mongoUtil' );
const express = require('express');
const User = require("../models/User");
const { ObjectId } = require('mongodb');
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

exports.getToken = function (user) {
  return jwt.sign(user, config.secretkey
  );
};
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = config.secretkey;

var strategy = new JwtStrategy(jwtOptions, async function (jwt_payload, next) {
  //var db = await mongoUtil.getDb();

  const result = await User.findOne({ "_id": ObjectId(jwt_payload.id) }, { password: 0 });
  result != null ? next(null, result) : next(null, false);

});
exports.verifyUser = passport.authenticate('jwt', { session: false });
passport.use(strategy);

