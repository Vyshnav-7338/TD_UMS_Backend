var axios = require('axios');

function sendOtp(data) {

  var config = {
    method: 'post',
    url: `https://graph.facebook.com/v18.0/254902477696018/messages`,
    headers: {
      'Authorization': 'Bearer EAAESgfIjHNEBO3yP7UEfcGVIZBZAcOB9lEgPONPWZAGoNkXiR2ttq1EqyxYcn8kl272ZAwSFYZCgy3jZANryHzeH7VgxZCylQbzcYxINlNreQ1Hkm4g5AIqZB9cUk1Gx3hBMg7ep3mgDLpwz2kxjByAlAPhQVC5sZCWndeyVRqyYGbjQJZCVQ8LiOaj0WgZCfpZCC8OjUwZDZD',
      // 'Authorization': 'Bearer EAAESgfIjHNEBO0tWDM7FtjtZBFpcPlJAbQNKbfXwvoUXVjCooPCYgAPePArHTSCzuRZAmprd8JZCA9XKaMMcZAbz2EZCEd0sXJw98Gxhq7fWFEUAgWAxuqRey1ic2PoZB5PKxxgk10SWimQotZAmnmxdqM4sInqQZBNH31F9oUjmBloF4nWjL81dEG8uhiyNnQJRzkZBH83VMt5iYCGgc',// temp (24hrs)
      'Content-Type': 'application/json'
    },
    data: data
  };

  return axios(config)
    .then(response => {
      console.log("Message sent successfully:", response.data);
      return response.data;
    })
    .catch(error => {
      console.error("Error sending message:", error.response.data);
      throw error;
    });
}

function getOtpInput(recipient, otp) {
  return JSON.stringify({
    "messaging_product": "whatsapp",
    "to": recipient,
    "type": "template",
    "template": {
      "name": "otp_message",
      "language": {
        "code": "en_US"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": otp
            }
          ]
        }
      ]
    }

  });
}

module.exports = {
  sendOtp: sendOtp,
  getOtpInput: getOtpInput
};
