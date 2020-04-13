const config = require('./config/config');

const fs = require('fs');
const moment = require('moment');
const request = require('request');

const limit = process.argv.slice(2)[0];
const output = process.argv.slice(3)[0];

if (limit === undefined) {
  console.log(`\nEXECUTE: ${process.argv[0]} ${process.argv[1]} LIMIT OUTPUT.CSV\n\n`);
  process.exit(-1);
}

if (output === undefined) {
  console.log(`\nEXECUTE: ${process.argv[0]} ${process.argv[1]} LIMIT OUTPUT.CSV\n\n`);
  process.exit(-1);
}

request.post({
  url: config.smsgateway.url_search,
  headers: {
    'Authorization': config.smsgateway.token,
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json'
  },
  body: {"order_by": [{"field": "created_at", "direction": "desc"}], "limit": +limit},
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

    fs.writeFileSync(output, "ID,DEVICE_ID,PHONE_NUMBER,STATUS,CREATED_AT,UPDATED_AT,MESSAGE\n");

    body.results.forEach((msg) => {
      let line = msg.id + ',' + msg.device_id + ',' + msg.phone_number + ',"' + msg.status + '","' + moment(msg.created_at).format() + '","' + moment(msg.updated_at).format() + '","' + msg.message + '"\n';
      fs.appendFileSync(output, line);
    });

    console.log("RESULT:", output);
    console.log("END");
  }
});

