const express = require("express");
const bodyParser = require("body-parser");
const myRouter = express.Router();
const auth = require("./authenticate");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

myRouter.use(bodyParser.json());
myRouter
  .route("/")
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    next();
  })
  .get((req, res, next) => {
    res.status(403).end("GET operation not supported on /login");
  })
  .post(async (req, res, next) => {
    const { id, email, password, appField } = req.body;

    if (!email && !id) {
      return res.status(400).send("Email or ID required");
    }

    if (!password) {
      return res.status(400).send("Password required");
    }

    try {
      const query = id ? { _id: ObjectId(id) } : { email };
      const user = await User.findOne(query);

      if (!user) {
        return res
          .status(401)
          .send({ status: "error", message: "No users found" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(403).send("Wrong password");
      }


      const payload = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = auth.getToken(payload);

      const resData = {
        id: user._id,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        name: user.name,
        role: user.role,
      };

      const response = {
        status: "done",
        data: resData,
        token,
        message: "User logged in successfully",
      };

      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

module.exports = myRouter;
