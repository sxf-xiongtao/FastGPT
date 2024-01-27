import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { AuthCodeSchema as AuthCodeType } from '@/global/user/auth/type.d';

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
  time: {
    type: Date,
    default: () => Date.now()
  }
});

try {
  AuthCodeSchema.index({ time: 1 }, { expireAfterSeconds: 5 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoAuthCode: Model<AuthCodeType> =
  models['auth_code'] || model('auth_code', AuthCodeSchema);
