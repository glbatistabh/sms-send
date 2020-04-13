const config = require('./config/config');

const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const csv = require('csv-parser');
const request = require('request');

const inputFile = process.argv.slice(2)[0];
const submitData = process.argv.slice(3)[0] || false; // true || 1: envia os dados para o servidor

if (inputFile === undefined) {
  console.log(`\nEXECUTE: ${process.argv[0]} ${process.argv[1]} file.csv [true|false]\n\n`);
  process.exit(-1);
}
else if (fs.existsSync(inputFile) === false) {
  console.log(`\nArquivo ${inputFile} não existe.\n\n`);
  process.exit(-1);
}


let count = 0;
let messages = [];

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', function(data) {

      data.device_id = data.device.replace(/[^0-9]/g, '');

      data.phone_number = data.phone.replace(/[^0-9]/g, '');

      data.send_at = data.hasOwnProperty('timestamp') ? data.timestamp : moment().unix();

      data.message = data.message.replace("#TIME#", moment(data.send_at * 1000).format("HH:mm"));
      data.message = data.message.replace("#DATE#", moment(data.send_at * 1000).format("DD/MM/YY"));
      data.message = data.message.replace("#NAME#", data.hasOwnProperty('name') ? data.name : "");

      delete data.name;
      delete data.phone;
      delete data.timestamp;

      //console.log(data);

      console.log(++count + '\tPhone: ' + data.phone_number + '; Send: ' + moment(data.send_at * 1000).format("DD/MM/YYYY HH:mm:ss") + 'h; Message: ' + data.message);
      messages.push(data);
    })
    .on('end', function() {
      //so teste
      if (submitData !== true && submitData !== 'true') {
        console.log("FIM");
        return;
      }
      else {
        request.post({
          url: config.smsgateway.url,
          headers: {
            'Authorization': config.smsgateway.token,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          },
          body: messages,
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
            body.forEach((message) => {
              console.log('ID: ' + message.id + '; PHONE_NUMBER: ' + message.phone_number + '; STATUS: ' + message.status);
            });
          }
          console.log("FIM");
        });
      }
    });


