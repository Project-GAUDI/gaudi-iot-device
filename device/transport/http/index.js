// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const device = require('azure-iot-device');
const Http = require('./dist/http').Http;

/**
 * The `azure-iot-device-http` module provides support for the HTTPS protocol to the device [client]{@link module:azure-iot-device.Client}.
 *
 * @module azure-iot-device-http
 * @requires module:azure-iot-device
 */

module.exports = {
  Http: Http,
  clientFromConnectionString: function (connectionString) {
    return device.Client.fromConnectionString(connectionString, Http);
  }
};
