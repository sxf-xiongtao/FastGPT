import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { AuthCodeSchema as AuthCodeType } from '@/types/mongoSchema';

const AuthCodeSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['register', 'findPassword'],
    required: true
  },
  expiredTime: {
    type: Number,
    default: () => Date.now() + 5 * 60 * 1000
  }
});

try {
  AuthCodeSchema.index({ expiredTime: 1 }, { expireAfterSeconds: 6 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoAuthCode: Model<AuthCodeType> =
  models['auth_code'] || model('auth_code', AuthCodeSchema);
