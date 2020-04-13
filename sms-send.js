const config = require('./config/config');

const fs = require('fs');
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

      data.message = data.message.replace("#NAME#", data.hasOwnProperty('name') ? data.name : "");
      data.message = data.message.replace("#PRD#", data.hasOwnProperty('product') ? data.product : "");
      data.message = data.message.replace("#VALUE#", data.hasOwnProperty('value') ? data.value : "");

      delete data.name;
      delete data.phone;
      delete data.timestamp;

      console.log(++count + '\tPhone: ' + data.phone_number + ';\tMessage: ' + data.message);
      messages.push(data);
    })
    .on('end', function() {

      //so teste
      if (submitData !== true && submitData !== 'true') {
        console.log("END");
        return;
      }
      else {
        count = 0;
        console.log('\n\nINIT...');
        async.eachSeries(messages, function(message, callback) {
          request.post({
            url: config.smsgateway.url_send,
            headers: {
              'Authorization': config.smsgateway.token,
              'Content-Type': 'application/vnd.api+json',
              'Accept': 'application/vnd.api+json'
            },
            body: [message],
            json: true
          }, function(error, response, body) {
            if (error) {
              console.log(++count + '\tID: ' + message.id + '; PHONE_NUMBER: ' + message.phone_number + '; STATUS: ERROR');
              return callback({message: message, error: error, body: body});
            }
            else if (response.statusCode !== 200) {
              console.log(++count + '\tID: ' + message.id + '; PHONE_NUMBER: ' + message.phone_number + '; STATUS: ERROR - ' + JSON.stringify(body));
              return callback({message: message, error: error, body: body});
            }
            else {
              body.forEach((message) => {
                console.log(++count + '\tID: ' + message.id + '; PHONE_NUMBER: ' + message.phone_number + '; STATUS: ' + message.status);
              });
              return setTimeout(callback, config.interval);
            }
          });
        }, function(err) {
          if (err) console.log("ERROR MESSAGE: ", err);
          console.log('END');
        });
      }
    });


