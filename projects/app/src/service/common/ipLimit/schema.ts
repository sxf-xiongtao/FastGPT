import { connectionMongo, getMongoModel, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import type { IpLimitSchemaType } from './type.d';

const IpLimitSchema = new Schema({
  eventId: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  account: {
    type: Number,
    default: 0
  },
  lastMinute: {
    type: Date,
    default: () => new Date()
  }
});

export const MongoIpLimit = getMongoModel<IpLimitSchemaType>('ip_limit', IpLimitSchema);
