var passport = require("passport");
var config = require("./config.js")

var cors = require("cors");
const express = require("express");
const app = express();
const port = 4001;
const bodyParser = require("body-parser");
var cookies = require("cookie-parser");
const fileUpload = require("express-fileupload");
app.use(fileUpload());
app.use(cookies());

//socketio 
const socketio = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketio(server);

// Socket.IO

//
app.use(express.json());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

const handleErrors = require("./middlewares/HandleError.js");
app.use(handleErrors);

const mongoose = require("mongoose");

var dbUrl = config.db_live ? config.dburl_live : config.dburl_local
mongourl = dbUrl

mongoose.connect(mongourl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

var expressMongoDb = require("express-mongo-db");
app.use(expressMongoDb(mongourl));

//============================ DEFINE ROUTES HERE ======================
const loginroute = require("./auth/login.js");
app.use("/api/login", loginroute);
const regroute = require("./auth/register.js");
app.use("/", regroute);

// const rpwdroute = require('./auth/resetpwd.js');
// app.use('/auth/reset_password', rpwdroute);

//default users seeder

// const seedroute = require("./auth/default_setup.js");
// app.use("/auth/setup", seedroute);

const cdnroute = require("./routes/cdn.js");
app.use("/", cdnroute);

const userroute = require("./routes/user.js");
app.use("/", userroute);

const productroute = require("./routes/product.js");
app.use("/", productroute);


app.use(express.static("public"));

// Start WebSocket server
// websocketServer(wss);

//app.use(express.static('public'))
server.listen(port, () =>
  console.log(`Admin app listening at http://localhost:${port}`)
);
process.env["NTBA_FIX_350"] = 1;
