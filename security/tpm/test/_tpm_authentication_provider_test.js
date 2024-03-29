// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const errors = require('azure-iot-common').errors;
const TpmAuthenticationProvider  = require('../dist/tpm_authentication_provider.js').TpmAuthenticationProvider;
const sinon = require('sinon');
const assert = require('chai').assert;

describe('TpmAuthenticationProvider', function () {
  let testSecurityClient;
  const testSRK = Buffer.from('SRK');
  const testSignedData = Buffer.from('signed data');
  const testRegistrationId = 'regId';
  const testCredentials = {
    host: 'test.host',
    deviceId: 'deviceId'
  };

  beforeEach(function () {
    testSecurityClient = {
      getStorageRootKey: sinon.stub().callsArgWith(0, null, testSRK),
      signWithIdentity: sinon.stub().callsArgWith(1, null, testSignedData),
      getEndorsementKey: sinon.stub().callsArg(1),
      getRegistrationId: sinon.stub().callsArgWith(0, null, testRegistrationId)
    };
  });

  afterEach(function () {
    testSecurityClient = undefined;
  });

  describe('getDeviceCredentials', function () {
    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_001: [`getDeviceCredentials` shall use the `SharedAccessSignature.createWithSigningFunction` method with the `signWithIdentity` method of the `TpmSecurityClient` given to the constructor to generate a SAS token.]*/
    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_002: [`getDeviceCredentials` shall call its callback with an `null` first parameter and the generated SAS token as a second parameter if the SAS token creation is successful.]*/
    it('gets device credentials', function (testCallback) {
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      authProvider.getDeviceCredentials(function (err, creds) {
        if (err) {
          testCallback(err);
        } else {
          assert.strictEqual(creds.deviceId, testCredentials.deviceId);
          assert.strictEqual(creds.host, testCredentials.host);
          assert.isString(creds.sharedAccessSignature);
          authProvider.stop();
          testCallback();
        }
      });
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_003: [`getDeviceCredentials` shall call its callback with an `Error` object if the SAS token creation fails.]*/
    it('calls its callback with an error if signing fails', function (testCallback) {
      const testError = new Error('test');
      testSecurityClient.signWithIdentity = sinon.stub().callsArgWith(1, testError);
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      authProvider.getDeviceCredentials(function (err) {
        assert.strictEqual(err, testError);
        testCallback();
      });
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_004: [`getDeviceCredentials` shall start a timer to renew the SAS token after the time the token is valid minus the renewal margin (60 - 15 = 45 minutes by default).]*/
    it('starts a timer to renew the token', function () {
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      // configure authProvider to renew the token after 9 seconds.
      authProvider._tokenRenewalMarginInSeconds = 1;
      authProvider._tokenValidTimeInSeconds = 10;

      const newTokenHandler = sinon.stub();
      const clock = sinon.useFakeTimers();
      authProvider.on('newTokenAvailable', newTokenHandler);
      authProvider.getDeviceCredentials(function () {});
      assert.isTrue(newTokenHandler.calledOnce); // called immediately when the token is first generated.
      clock.tick(8999);
      assert.isTrue(newTokenHandler.calledOnce); // still called once since the token is re-generated when the timer hits 9 seconds.
      clock.tick(1000);
      assert.isTrue(newTokenHandler.calledTwice); // now called twice since 9 seconds have elapsed.
      clock.restore();
      authProvider.stop();
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_008: [a `newTokenAvailable` event shall be emitted if renewing the SAS token succeeds in the timer handler.]*/
    it('timer keeps running to renew the token', function () {
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      // configure authProvider to renew the token after 9 seconds.
      authProvider._tokenRenewalMarginInSeconds = 1;
      authProvider._tokenValidTimeInSeconds = 10;

      const newTokenHandler = sinon.stub();
      const clock = sinon.useFakeTimers();
      authProvider.on('newTokenAvailable', newTokenHandler);
      authProvider.getDeviceCredentials(function () {});
      assert.isTrue(newTokenHandler.calledOnce); // called immediately when the token is first generated.
      clock.tick(8999);
      assert.isTrue(newTokenHandler.calledOnce); // still called once since the token is re-generated when the timer hits 9 seconds.
      clock.tick(1000);
      assert.isTrue(newTokenHandler.calledTwice); // now called twice since 9 seconds have elapsed.
      clock.tick(10000);
      assert.isTrue(newTokenHandler.calledThrice);
      clock.restore();
      authProvider.stop();
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_007: [an `error` event shall be emitted if renewing the SAS token fail in the timer handler.]*/
    it('emits an error if signing fails when the token is renewed by the timer', function () {
      const testError = new Error('test');
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      // configure authProvider to renew the token after 9 seconds.
      authProvider._tokenRenewalMarginInSeconds = 1;
      authProvider._tokenValidTimeInSeconds = 10;
      const errorHandler = sinon.stub();
      const newTokenHandler = sinon.stub();
      authProvider.on('error', errorHandler);
      authProvider.on('newTokenAvailable', newTokenHandler);

      const clock = sinon.useFakeTimers();
      authProvider.getDeviceCredentials(function () {});
      assert.isTrue(newTokenHandler.calledOnce); // called immediately when the token is first generated.
      testSecurityClient.signWithIdentity = sinon.stub().callsArgWith(1, testError);
      clock.tick(9000);
      assert.isTrue(errorHandler.calledOnce);
      assert.isTrue(errorHandler.calledWith(testError));
      clock.restore();
      authProvider.stop();
    });
  });

  describe('updateSharedAccessSignature', function () {
    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_005: [`updateSharedAccessSignature` shall throw an `InvalidOperationError` since it's the role of the TPM to generate SAS tokens.]*/
    it('throws an InvalidOperationError', function () {
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      assert.throws(function () {
        authProvider.updateSharedAccessSignature('sas');
      }, errors.InvalidOperationError);
    });
  });

  describe('stop', function () {
    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_006: [`stop` shall stop the renewal timer if it is running.]*/
    it('stops the token renewal', function () {
      const authProvider = new TpmAuthenticationProvider(testCredentials, testSecurityClient);
      // configure authProvider to renew the token after 9 seconds
      authProvider._tokenRenewalMarginInSeconds = 1;
      authProvider._tokenValidTimeInSeconds = 10;

      const newTokenHandler = sinon.stub();
      const clock = sinon.useFakeTimers();
      authProvider.on('newTokenAvailable', newTokenHandler);
      authProvider.getDeviceCredentials(function () {});
      assert.isTrue(newTokenHandler.calledOnce); // called immediately when the token is first generated.
      clock.tick(8999);
      assert.isTrue(newTokenHandler.calledOnce); // still called once since the token is re-generated when the timer hits 9 seconds.
      clock.tick(1000);
      assert.isTrue(newTokenHandler.calledTwice); // now called twice since 9 seconds have elapsed.
      authProvider.stop();
      clock.tick(10000)
      assert.isTrue(newTokenHandler.calledTwice); // called twice and not thrice since it is stopped even though 19 seconds have elapsed.
      clock.restore();
    });
  });

  describe('fromSecurityClient', function () {
    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_012: [The `fromSecurityClient` method shall instantiate a new `TpmSecurityClient` object.]*/
    it('returns a TpmAuthenticationProvider', function () {
      const testAuthProvider = TpmAuthenticationProvider.fromTpmSecurityClient(testCredentials.deviceId, testCredentials.host, testSecurityClient);
      assert.instanceOf(testAuthProvider, TpmAuthenticationProvider);
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_009: [The `fromSecurityClient` method shall throw a `ReferenceError` if `deviceId` is falsy.]*/
    [undefined, null, ''].forEach(function (badDeviceId) {
      it('throws if deviceId is \'' + badDeviceId  + '\'', function () {
        assert.throws(function () {
          TpmAuthenticationProvider.fromTpmSecurityClient(badDeviceId, testCredentials.host, testSecurityClient);
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_010: [The `fromSecurityClient` method shall throw a `ReferenceError` if `iotHubHostname` is falsy.]*/
    [undefined, null, ''].forEach(function (badHostname) {
      it('throws if hostname is \'' + badHostname + '\'', function () {
        assert.throws(function () {
          TpmAuthenticationProvider.fromTpmSecurityClient(testCredentials.deviceId, badHostname, testSecurityClient);
        }, ReferenceError);
      });
    });

    /*Tests_SRS_NODE_TPM_AUTH_PROVIDER_16_011: [The `fromSecurityClient` method shall throw a `ReferenceError` if `tpmSecurityClient` is falsy.]*/
    [undefined, null, ''].forEach(function (badSecurityClient) {
      it('throws if securityClient is \'' + badSecurityClient + '\'', function () {
        assert.throws(function () {
          TpmAuthenticationProvider.fromTpmSecurityClient(testCredentials.deviceId, testCredentials.host, badSecurityClient);
        }, ReferenceError);
      });
    });
  });
});
