// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

let assert = require('chai').assert;
let ArgumentError = require('azure-iot-common').errors.ArgumentError;
let SharedAccessSignature = require('../dist/shared_access_signature.js');

let incompleteSignatures = {
  sr: 'SharedAccessSignature sig=signature&se=expiry',
  sig: 'SharedAccessSignature sr=audience&se=expiry',
  se: 'SharedAccessSignature sr=audience&sig=signature'
};

describe('SharedAccessSignature', function () {
  describe('#create', function () {
    /*Tests_SRS_NODE_DEVICE_SAS_05_004: [<urlEncodedDeviceId> shall be the URL-encoded value of deviceId.]*/
    /*Tests_SRS_NODE_DEVICE_SAS_05_003: [The create method shall return the result of calling azure-iot-common.SharedAccessSignature.create with following arguments:
    resourceUri - host + '/devices/' + <urlEncodedDeviceId>
    keyName - null
    key - key
    expiry - expiry]*/
    it('creates a shared access signature', function () {
      let expect = 'SharedAccessSignature sr=host%2Fdevices%2Fdevice&sig=wM3XiP6gD960IxP7J5WHqnxQHEcWC6YaQCtoMT%2BkKHc%3D&se=12345';
      let sas = SharedAccessSignature.create('host', 'device', 'key', 12345);
      assert.equal(expect, sas.toString());
    });
  });

  describe('#parse', function () {
    /*Tests_SRS_NODE_DEVICE_SAS_05_001: [The parse method shall return the result of calling azure-iot-common.SharedAccessSignature.parse.]*/
    /*Tests_SRS_NODE_DEVICE_SAS_05_002: [It shall throw ArgumentError if any of 'sr', 'sig', 'se' fields are not found in the source argument.]*/
    ['sr', 'sig', 'se'].forEach(function (key) {
      it('throws if shared access signature is missing ' + key, function () {
        assert.throws(function () {
          SharedAccessSignature.parse(incompleteSignatures[key]);
        }, ArgumentError);
      });
    });

    it('does not throw if shared access signature is missing skn', function () {
      assert.doesNotThrow(function () {
        SharedAccessSignature.parse('SharedAccessSignature sr=audience&sig=signature&skn=keyname&se=expiry');
      }, ArgumentError);
    });
  });
});
