// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const ArgumentError = require('azure-iot-common').errors.ArgumentError;
const SymmetricKeySecurityClient  = require('../dist/symmetric_key').SymmetricKeySecurityClient ;
const assert = require('chai').assert;

describe('symmetric key', function () {
  describe('getRegistrationId', function () {
    it('returns the registrationId', function (done) {
      const fakeRegistrationId = 'registrationId';
      const fakeSymmetricKey = 'fakeKey';
      const client = new SymmetricKeySecurityClient(fakeRegistrationId, fakeSymmetricKey);
      client.getRegistrationId(function (err, returnedId) {
        assert.isNotOk(err);
        assert.equal(returnedId, fakeRegistrationId);
        done();
      });
    });
  });

  describe('createSharedAccessSignature', function () {
    /*Tests_SRS_NODE_SYMMETRIC_KEY_SECURITY_CLIENT_06_005: [Will throw `ReferenceError` if `idScope` parameter is falsy. ] */
    [undefined, null, ''].forEach(function (badIdScope) {
      it('throws if idScope is \'' + badIdScope +'\'', function () {
        const fakeRegistrationId = 'registrationId';
        const fakeSymmetricKey = 'fakeKey';
        const client = new SymmetricKeySecurityClient(fakeRegistrationId, fakeSymmetricKey);
        assert.throws(function () {
          client.createSharedAccessSignature(badIdScope, function () {});
        }, ReferenceError, '');
      });
    });

    /*Tests_SRS_NODE_SYMMETRIC_KEY_SECURITY_CLIENT_06_006: [The `idScope` parameter must be of type string. ] */
    [1, true, 15.5, { a: 'b' }].forEach(function (badIdScope) {
      it('throws if idScope is \'' + badIdScope +'\'', function () {
        const fakeRegistrationId = 'registrationId';
        const fakeSymmetricKey = 'fakeKey';
        const client = new SymmetricKeySecurityClient(fakeRegistrationId, fakeSymmetricKey);
        assert.throws(function () {
          client.createSharedAccessSignature(badIdScope, function () {});
        }, ArgumentError, '');
      });
    });

    it('returns a correct SharedAccessSignature object', function (done) {
      /*Tests_SRS_NODE_SYMMETRIC_KEY_SECURITY_CLIENT_06_007: [** A SharedAccessSignature object shall be returned, based on the `idScope`, and the `registrationId` given in the constructor. **] */
      const fakeRegistrationId = 'registrationId';
      const fakeSymmetricKey = 'fakeKey';
      const fakeIdScope = 'fakeScope';
      const client = new SymmetricKeySecurityClient(fakeRegistrationId, fakeSymmetricKey);
      client.createSharedAccessSignature(fakeIdScope, function (err, sasTokenObject) {
        assert.isNotOk(err);
        assert.equal(sasTokenObject.sr, fakeIdScope + '/registrations/' + fakeRegistrationId);
        assert.equal(sasTokenObject.skn, 'registration');
        assert.isOk(sasTokenObject.se);
        assert.isOk(sasTokenObject.sig);
        done();
      });
    });
  });
});
