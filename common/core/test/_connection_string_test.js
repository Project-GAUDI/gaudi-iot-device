// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const assert = require('chai').assert;
const ArgumentError = require('../dist/errors.js').ArgumentError;
const ConnectionString = require('../dist/connection_string.js').ConnectionString;

describe('ConnectionString', function () {
  describe('#constructor', function () {
    it('creates a ConnectionString object', function () {
      assert.instanceOf(new ConnectionString(), ConnectionString);
    });
  });

  describe('#parse', function () {
    /*Tests_SRS_NODE_CONNSTR_05_005: [The parse method shall throw ArgumentError if any of fields in the requiredFields argument are not found in the source argument.]*/
    it('throws if connection string is missing a required field', function () {
      assert.throws(function () {
        ConnectionString.parse('one=abc;two=123', ['one', 'two', 'three']);
      }, ArgumentError, 'The connection string is missing the property: three');
    });

    /*Tests_SRS_NODE_CONNSTR_05_002: [The parse method shall create a new instance of ConnectionString.]*/
    /*Tests_SRS_NODE_CONNSTR_05_003: [It shall accept a string argument of the form 'name=value[;name=value…]' and for each name extracted it shall create a new property on the ConnectionString object instance.]*/
    /*Tests_SRS_NODE_CONNSTR_05_004: [The value of the property shall be the value extracted from the source argument for the corresponding name.]*/
    /*Tests_SRS_NODE_CONNSTR_05_006: [The generated ConnectionString object shall be returned to the caller.]*/
    /*Tests_SRS_NODE_CONNSTR_05_007: [If requiredFields is falsy, parse shall not validate fields.]*/
    it('returns an object with all the properties of the connection string', function () {
      const str = 'HostName=name;DeviceId=id;ModuleId=mod;SharedAccessKey=key;GatewayHostName=name';
      const cn = ConnectionString.parse(str);
      assert.deepEqual(cn, {
        HostName: 'name',
        DeviceId: 'id',
        ModuleId: 'mod',
        SharedAccessKey: 'key',
        GatewayHostName: 'name'
      });
    });

    /*Tests_SRS_NODE_CONNSTR_05_001: [The input argument source shall be converted to string if necessary.]*/
    it('accepts an argument that can be converted to String', function () {
      const obj = {
        value: 'HostName=name;DeviceId=id;ModuleId=mod;SharedAccessKey=key;GatewayHostName=name',
        toString: function () { return this.value; }
      };
      const cn = ConnectionString.parse(obj);
      assert.deepEqual(cn, {
        HostName: 'name',
        DeviceId: 'id',
        ModuleId: 'mod',
        SharedAccessKey: 'key',
        GatewayHostName: 'name'
      });
    });
  });
});
