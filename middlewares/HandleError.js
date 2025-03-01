

const handleErrors = (err, req, res, next) => {
  console.log("handle error called")
  console.log(err)

  var stcode = 500;
  if (err["name"] == "ValidationError") {
    stcode = 400;
    return res.status(stcode).json({
      status: 'error',
      message: err.message
    });
  }
  else if (err["code"] == 11000) {
    stcode = 409 //duplicate entry
    return res.status(stcode).json({
      status: 'error',
      message: "Data already exists in server"
    });
  }
  else {
    return res.status(stcode).json({
      status: 'error',
      message: err.message
    });
  }
}


module.exports = handleErrors;
