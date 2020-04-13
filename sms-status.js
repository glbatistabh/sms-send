const config = require('./config/config');

const request = require('request');

const message_id = process.argv.slice(2)[0];

if (message_id === undefined) {
  console.log(`\nEXECUTE: ${process.argv[0]} ${process.argv[1]} ID_MESSAGE\n\n`);
  process.exit(-1);
}

request.get({
  url: config.smsgateway.url.replace("send", message_id),
  headers: {
    'Authorization': config.smsgateway.token,
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json'
  },
  json: true
}, function(error, response, body) {
  if (error) {
    console.log("\n\nERROR = ", error);
  }
  else if (response.statusCode === 400) {
    console.log("\n\nValidation Error");
    console.log(response.body);
  }
  else {
    console.log("\n\nRESULT:");
    console.log(body);
  }
  console.log("FIM");
});

