const express = require("express");
const bodyParser = require("body-parser");
const myRouter = express.Router();
const User = require("../models/User");
const futils = require("../utils/fileutils");
const utils = require("../utils/utils");
const generateReferenceCode = require("../utils/referenceCodeGenerator");
const handleErrors = require("../middlewares/HandleError");
var auth = require("../auth/authenticate");

myRouter.use(bodyParser.json());

myRouter.route("/api/add_user").post(auth.verifyUser,async(req, res, next) => {
  console.log("User register called");
  const body = req.body;
  const StoreAdmin =req.user.id
  console.log(StoreAdmin)
  const files = req.files || {};

  const missingBodyFields = [];
  if (!body.password) missingBodyFields.push("password");
  if (!body.phone) missingBodyFields.push("phone");
  if (!body.gender) missingBodyFields.push("gender");
  if (!body.dob) missingBodyFields.push("date of birth (dob)");
  if (!body.address) missingBodyFields.push("address");

  if (missingBodyFields.length > 0) {
    return res.status(400).send({
      status: "error",
      message: `${missingBodyFields.join(", ")} required`,
    });
  }

  const missingFileFields = [];
  if (!files["photo"]) missingFileFields.push("Photo");

  if (missingFileFields.length > 0) {
    return res.status(400).send({
      status: "error",
      message: `${missingFileFields.join(", ")} required`,
    });
  }

  const passwordStrength = utils.CheckPasswordStrong(body.password);
  if (passwordStrength !== true) {
    return res.status(400).send({ status: "error", message: passwordStrength });
  }

  try {
    body.photo = await futils.getFileObject(files["photo"]);
    body.role = "admin";
    body.StoreAdmin = StoreAdmin;
    body.referenceCode = generateReferenceCode();
   
    const user = new User(body);
    const savedUser = await user.save();
    res.status(200).json({ status: "success", user: savedUser });
    console.log("User registered successfully");
  } catch (error) {
    console.error("Error registering user:", error);
    next(error);
  }
});

myRouter.use(handleErrors);

module.exports = myRouter;
