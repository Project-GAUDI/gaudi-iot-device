// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const EventEmitter = require('events').EventEmitter;
const assert = require('chai').assert;
const sinon = require('sinon');
const MqttWs = require('../dist/mqtt_ws.js').MqttWs;

describe('MqttWs', function () {
  const fakeConfig = {
    host: 'host.name',
    deviceId: 'deviceId',
    sharedAccessSignature: 'sas'
  };

  const fakeAuthenticationProvider = {
    getDeviceCredentials: function (callback) {
      callback(null, fakeConfig);
    }
  };

  const fakeMqttBase = new EventEmitter();
  fakeMqttBase.connect = sinon.stub().callsArg(1);
  fakeMqttBase.disconnect = sinon.stub().callsArg(0);
  fakeMqttBase.publish = sinon.stub().callsArg(3);
  fakeMqttBase.subscribe = sinon.stub().callsArg(2);
  fakeMqttBase.unsubscribe = sinon.stub().callsArg(1);
  fakeMqttBase.updateSharedAccessSignature = sinon.stub().callsArg(1);

  describe('#constructor', function () {
    /* Tests_SRS_NODE_DEVICE_MQTT_12_001: [The `Mqtt` constructor shall accept the transport configuration structure */
    /* Tests_SRS_NODE_DEVICE_MQTT_12_002: [The `Mqtt` constructor shall store the configuration structure in a member variable */
    it('stores config and created transport in member', function () {
      const mqttWs = new MqttWs(fakeAuthenticationProvider);
      assert.notEqual(mqttWs, null);
      assert.notEqual(mqttWs, undefined);
      assert.equal(mqttWs._authenticationProvider, fakeAuthenticationProvider);
    });
  });

  describe('#connect', function () {
    /*Tests_SRS_NODE_DEVICE_MQTT_16_017: [The `MqttWs` constructor shall initialize the `uri` property of the `config` object to `wss://<host>:443/$iothub/websocket`.]*/
    it('sets the uri property to \'wss://<host>:443/$iothub/websocket\'', function (testCallback) {
      const mqttWs = new MqttWs(fakeAuthenticationProvider, fakeMqttBase);
      mqttWs.connect(function () {
        assert.strictEqual(fakeMqttBase.connect.firstCall.args[0].uri, 'wss://' + fakeConfig.host + ':443/$iothub/websocket');
        testCallback();
      });
    });
  })
});
