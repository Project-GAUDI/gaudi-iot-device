// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

let ModuleTestHelper = require('./module_test_helper.js');
let assert = require('chai').assert;
let debug = require('debug')('e2etests:module-twin');
let Amqp = require('azure-iot-device-amqp').Amqp;
let AmqpWs = require('azure-iot-device-amqp').AmqpWs;
let Mqtt = require('azure-iot-device-mqtt').Mqtt;
let MqttWs = require('azure-iot-device-mqtt').MqttWs;

let transportsToTest = [ Amqp, AmqpWs, Mqtt, MqttWs ];

describe('module twin', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);

  transportsToTest.forEach(function (Transport) {
    describe('using ' + Transport.name, function () {
      let testModule = {};

      before(function (done) {
        debug('using ModuleTestHelper to create modules');
        ModuleTestHelper.createModule(testModule, Transport, function (err) {
          debug('ModuleTestHelper.createModule returned ' + (err ? err : 'success'));
          if (err) {
            done(err);
          } else {
            // Wait a second before getting the twin. Otherwies, we might get a "not found" back from iothub
            setTimeout(function () {
              debug('using ModuleTestHelper to get twin objects');
              ModuleTestHelper.getTwinObjects(testModule, function (err) {
                debug('ModuleTestHelper.getTwinObjects returned ' + (err ? err : 'success'));
                done(err);
              });
            }, 1000);
          }
        });
      });

      after(function (done) {
        debug('using ModuleTestHelper to clean up after tests');
        ModuleTestHelper.cleanUpAfterTest(testModule, function (err) {
          debug('ModuleTestHelper.cleanUpAfterTest returned ' + (err ? err : 'success'));
          done(err);
        });
      });

      it ('can receive desired property changes', function (done) {
        let patch = {
          properties: {
            desired: {
              fake_key: '__FAKE_VALUE__'
            }
          }
        };
        debug('adding handler for properties.desired');
        testModule.deviceTwin.on('properties.desired', function (props) {
          debug('received properties:' + JSON.stringify(props));
          if (props.fake_key === patch.properties.desired.fake_key) {
            debug('key matches.  Finishing test');
            done();
          } else {
            debug('no match.  Continuing to wait.  Looking for ' + props.fake_key + ' got ' + patch.properties.desired.fake_key);
          }
        });

        setTimeout(function () {
          debug('sending desired properties');
          testModule.serviceTwin.update(patch, function (err) {
            debug('twin.update returned ' + (err ? err : 'success'));
            assert(!err);
          });
        }, 1000);
      });

      it('can send reported properties', function (done) {
        let patch = {
          another_fake_key: '__ANOTHER_FAKE_VALUE__'
        };

        debug('updating reported properties');
        testModule.deviceTwin.properties.reported.update(patch, function (err) {
          debug('twin.properties.reported.update returned ' + (err ? err : 'success'));
          if (err) {
            done(err);
          } else {
            debug('getting service twin');
            testModule.serviceTwin.get(function (err, twin) {
              debug('serviceTwin.get returned ' + (err ? err : 'success'));
              if (err) {
                done(err);
              } else {
                assert.strictEqual(twin.properties.reported.another_fake_key, patch.another_fake_key);
                done();
              }
            });
          }
        });
      });
    });
  });
});
