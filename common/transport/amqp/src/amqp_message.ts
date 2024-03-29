// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

import { uuid_to_string as rheaUuidToString, string_to_uuid as rheaStringToUuid, types as rheaTypes, message as rheaMessage } from 'rhea';
import { Message } from 'azure-iot-common';

/* tslint:disable:variable-name */
/* tslint:enable:variable-name: [true, "check-format", allow-leading-underscore", "ban-keywords", "allow-snake-case"]*/

function encodeUuid(uuidString: string): any {
  const uuidRegEx = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  let uuid;
  if (typeof uuidString === 'string' && uuidString.match(uuidRegEx)) {
    //
    // The rhea library will only serialize the the uuid with an encoding of 0x98 if the uuid property is actually
    // a 16 byte buffer.
    //
    uuid = rheaStringToUuid(uuidString);
  } else {
    uuid = uuidString;
  }
  return uuid;
}

/**
 * @private
 * @class           module:azure-iot-amqp-base.AmqpMessage
 * @classdesc       AMQP-specific message class used to prepare a [azure-iot-common.Message]{@link module:azure-iot-common.Message}
 *                  before it's sent over the wire using the AMQP protocol.
 */
export class AmqpMessage {
  to?: string;
  absolute_expiry_time?: Date;
  message_id?: string;
  correlation_id?: string;
  reply_to?: string;
  content_type?: undefined | 'application/json';
  content_encoding?: undefined | 'utf-8' | 'utf-16' | 'utf-32';
  body: any;
  application_properties: {
    [key: string]: any;
  };

  message_annotations: {
    [key: string]: any;
  };

  /**
   * @method          module:azure-iot-amqp-base.AmqpMessage.fromMessage
   * @description     Takes a azure-iot-common.Message{@link module:azure-iot-common.Message} object and creates an AMQP message from it.
   *
   * @param {module:azure-iot-common.Message}   message   The {@linkcode Message} object from which to create an AMQP message.
   */
  static fromMessage(message: Message): AmqpMessage {
    if (!message) throw new ReferenceError('message is \'' + message + '\'');

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_001: [The fromMessage method shall create a new instance of AmqpMessage.]*/
    const amqpMessage = new AmqpMessage();

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_003: [If the message argument has a to property, the AmqpMessage object shall have a property named to with the same value.]*/
    if (message.to) {
      amqpMessage.to = message.to;
    }
    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_004: [If the message argument has an expiryTimeUtc property, the AmqpMessage object shall have a property named absolute_expiry_time with the same value.]*/
    if (message.expiryTimeUtc) {
      amqpMessage.absolute_expiry_time = message.expiryTimeUtc;
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_007: [If the message argument has a messageId property, the AmqpMessage object shall have a property named messageId with the same value.]*/
    if (message.messageId) {
      amqpMessage.message_id = encodeUuid(message.messageId);
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_010: [If the `message` argument has a `correlationId` property, the `AmqpMessage` object shall have a property named `correlation_id` with the same value.]*/
    if (message.correlationId) {
      /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_012: [If the `Message.correlationId` property is a UUID, the AMQP type of the `AmqpMessage.correlation_id` property shall be forced to Buffer[16].]*/
      amqpMessage.correlation_id = encodeUuid(message.correlationId);
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_014: [If the `message` argument has a `contentEncoding` property, the `AmqpMessage` object shall have a property named `content_encoding` with the same value.]*/
    if (message.contentEncoding) {
      amqpMessage.content_encoding = message.contentEncoding;
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_015: [If the `message` argument has a `contentType` property, the `AmqpMessage` object shall have a property named `content_type` with the same value.]*/
    if (message.contentType) {
      amqpMessage.content_type = message.contentType;
    }

    if (message.interfaceId) {
      if (!amqpMessage.message_annotations) {
        amqpMessage.message_annotations = {
          'iothub-interface-id': message.interfaceId
        };
      } else {
        amqpMessage.message_annotations['iothub-interface-id'] = message.interfaceId;
      }
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_008: [If needed, the created AmqpMessage object shall have a property of type Object named application_properties.]*/
    function ensureApplicationPropertiesCreated(): void {
      if (!amqpMessage.application_properties) {
        amqpMessage.application_properties = {};
      }
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_009: [If the message argument has an ack property, the application_properties property of the AmqpMessage object shall have a property named iothub-ack with the same value.]*/
    if (message.ack) {
      ensureApplicationPropertiesCreated();
      amqpMessage.application_properties['iothub-ack'] = message.ack;
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_13_001: [ If message.properties is truthy, then all the properties in it shall be copied to the application_properties property of the AmqpMessage object. ]*/
    if (message.properties) {
      const props = message.properties;
      const propsCount = props.count();
      if (propsCount > 0) {
        const DT_SUBJECT = 'dt-subject';
        for (let index = 0; index < propsCount; index++) {
          const item = props.getItem(index);
          if (item) {
            if (item.key === DT_SUBJECT) {
              if (!amqpMessage.message_annotations) {
                amqpMessage.message_annotations = {
                  [DT_SUBJECT]: item.value
                };
              } else {
                amqpMessage.message_annotations[DT_SUBJECT] = item.value;
              }
            } else {
              if (!amqpMessage.application_properties) {
                ensureApplicationPropertiesCreated();
              }
              /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_013: [If one of the property key is `IoThub-status`, this property is reserved and shall be forced to an `int` `rhea` type.]*/
              const val = (item.key === 'IoThub-status') ? rheaTypes.wrap_int(parseInt(item.value)) : item.value;
              amqpMessage.application_properties[item.key] = val;
            }
          }
        }
      }
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_005: [If message.getData() is truthy, the AmqpMessage object shall have a property named body with the value returned from message.getData().]*/
    const body = message.getData();
    if (body !== undefined) {
      amqpMessage.body = rheaMessage.data_section(message.getBytes());
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_05_006: [The generated AmqpMessage object shall be returned to the caller.]*/
    return amqpMessage;
  }

  /**
   * @method          module:azure-iot-amqp-base.AmqpMessage.toMessage
   * @description     Creates a transport-agnostic azure-iot-common.Message{@link module:azure-iot-common.Message} object from transport-specific AMQP message.
   *
   * @param {AmqpMessage}   message   The {@linkcode AmqpMessage} object from which to create an Message.
   */
  static toMessage(amqpMessage: AmqpMessage): Message {
    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_001: [The `toMessage` method shall throw if the `amqpMessage` argument is falsy.]*/
    if (!amqpMessage) {
      throw new ReferenceError('amqpMessage cannot be \'' + amqpMessage + '\'');
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_009: [The `toMessage` method shall set the `Message.data` of the message to the content of the `AmqpMessage.body.content` property.]*/
    const msg: Message = ( amqpMessage.body ) ? ( new Message(amqpMessage.body.content) ) : ( new Message(undefined) );

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_005: [The `toMessage` method shall set the `Message.to` property to the `AmqpMessage.to` value if it is present.]*/
    if (amqpMessage.to) {
      msg.to = amqpMessage.to;
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_006: [The `toMessage` method shall set the `Message.expiryTimeUtc` property to the `AmqpMessage.absolute_expiry_time` value if it is present.]*/
    if (amqpMessage.absolute_expiry_time) {
      msg.expiryTimeUtc = amqpMessage.absolute_expiry_time;
    }

    //
    // The rhea library will de-serialize an encoded uuid (0x98) as a 16 byte buffer.
    // Since common messages should only have type string it is safe to decode
    // these as strings.
    //
    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_004: [The `toMessage` method shall set the `Message.messageId` property to the `AmqpMessage.message_id` value if it is present.]*/
    if (amqpMessage.message_id) {
      if (((amqpMessage.message_id as any) instanceof Buffer) && (amqpMessage.message_id.length === 16)) {
        msg.messageId = rheaUuidToString(amqpMessage.message_id as any);
      } else {
        msg.messageId = amqpMessage.message_id;
      }
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_003: [The `toMessage` method shall set the `Message.correlationId` property to the `AmqpMessage.correlation_id` value if it is present.]*/
    if (amqpMessage.correlation_id) {
      if (((amqpMessage.correlation_id as any) instanceof Buffer) && (amqpMessage.correlation_id.length === 16)) {
        msg.correlationId = rheaUuidToString(amqpMessage.correlation_id as any);
      } else {
        msg.correlationId = amqpMessage.correlation_id;
      }
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_016: [The `toMessage` method shall set the `Message.contentType` property to the `AmqpMessage.content_type` value if it is present. ]*/
    if (amqpMessage.content_type) {
      msg.contentType = amqpMessage.content_type;
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_017: [The `toMessage` method shall set the `Message.contentEncoding` property to the `AmqpMessage.content_encoding` value if it is present. ]*/
    if (amqpMessage.content_encoding) {
      msg.contentEncoding = amqpMessage.content_encoding;
    }

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_007: [The `toMessage` method shall convert the user-defined `AmqpMessage.applicationProperties` to a `Properties` collection stored in `Message.properties`.]*/
    if (amqpMessage.application_properties) {
      const appProps = amqpMessage.application_properties;
      for (const key in appProps) {
        if (Object.prototype.hasOwnProperty.call(appProps, key)) {
          /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_008: [The `toMessage` method shall set the `Message.ack` property to the `AmqpMessage.application_properties['iothub-ack']` value if it is present.]*/
          if (key === 'iothub-ack') {
            msg.ack = appProps[key];
          } else {
            msg.properties.add(key, appProps[key]);
          }
        }
      }
    }

    msg.transportObj = amqpMessage;

    /*Codes_SRS_NODE_IOTHUB_AMQPMSG_16_002: [The `toMessage` method shall return a `Message` object.]*/
    return msg;
  }
}
