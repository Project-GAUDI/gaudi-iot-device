/* eslint-disable security/detect-non-literal-fs-filename */
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Choose a protocol by uncommenting one of these transports.
const Protocol = require('azure-iot-device-mqtt').Mqtt;
// const Protocol = require('azure-iot-device-amqp').Amqp;
// const Protocol = require('azure-iot-device-http').Http;
// const Protocol = require('azure-iot-device-mqtt').MqttWs;
// const Protocol = require('azure-iot-device-amqp').AmqpWs;

const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const fs = require('fs');

// String containing Hostname and Device Id in the following format:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;x509=true"
const deviceConnectionString = process.env.IOTHUB_DEVICE_CONNECTION_STRING;
const certFile = process.env.PATH_TO_CERTIFICATE_FILE;
const keyFile = process.env.PATH_TO_KEY_FILE;
const passphrase = process.env.KEY_PASSPHRASE_OR_EMPTY; // Key Passphrase if one exists.

// fromConnectionString must specify a transport constructor, coming from any transport package.
const client = Client.fromConnectionString(deviceConnectionString, Protocol);
let sendInterval;

const connectCallback = function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Client connected');
    client.on('message', function (msg) {
      console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
      // When using MQTT the following line is a no-op.
      client.complete(msg, printResultFor('completed'));
      // The AMQP and HTTP transports also have the notion of completing, rejecting or abandoning the message.
      // When completing a message, the service that sent the C2D message is notified that the message has been processed.
      // When rejecting a message, the service that sent the C2D message is notified that the message won't be processed by the device. the method to use is client.reject(msg, callback).
      // When abandoning the message, IoT Hub will immediately try to resend it. The method to use is client.abandon(msg, callback).
      // MQTT is simpler: it accepts the message by default, and doesn't support rejecting or abandoning a message.
    });

    // Create a message and send it to the IoT Hub every second
    if (!sendInterval) {
      sendInterval = setInterval(function () {
        let windSpeed = 10 + (Math.random() * 4); // range: [10, 14]
        let temperature = 20 + (Math.random() * 10); // range: [20, 30]
        let humidity = 60 + (Math.random() * 20); // range: [60, 80]
        let data = JSON.stringify({ deviceId: 'myFirstDevice', windSpeed: windSpeed, temperature: temperature, humidity: humidity });
        let message = new Message(data);
        message.properties.add('temperatureAlert', (temperature > 28) ? 'true' : 'false');
        console.log('Sending message: ' + message.getData());
        client.sendEvent(message, printResultFor('send'));
      }, 2000);
    }

    client.on('error', function (err) {
      console.error(err.message);
    });

    client.on('disconnect', function () {
      clearInterval(sendInterval);
      sendInterval = null;
      client.removeAllListeners();
      client.open(connectCallback);
    });
  }
};

 const options = {
   cert : fs.readFileSync(certFile, 'utf-8').toString(),
   key : fs.readFileSync(keyFile, 'utf-8').toString(),
   passphrase: passphrase
 };

// Calling setOptions with the x509 certificate and key (and optionally, passphrase) will configure the client transport to use x509 when connecting to IoT Hub
client.setOptions(options);
client.open(connectCallback);

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}
