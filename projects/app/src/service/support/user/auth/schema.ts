import { connectionMongo, getMongoModel, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { UserAuthSchemaType } from '@/global/support/user/auth/type';
import { userAuthTypeMap } from '@fastgpt/global/support/user/auth/constants';

/* 
  user account auth
  1. login
  2. register
  3. find password
  4. wx login
  5. captcha
*/

const UserAuthSchema = new Schema({
  key: {
    type: String,
    required: true
  },
  code: {
    // auth code
    type: String,
    length: 6
  },
  openid: {
    // wx openid
    type: String
  },
  type: {
    type: String,
    enum: Object.keys(userAuthTypeMap),
    required: true
  },
  createTime: {
    type: Date,
    default: () => Date.now()
  }
});

try {
  UserAuthSchema.index({ key: 1, type: 1 });
  UserAuthSchema.index({ createTime: 1 }, { expireAfterSeconds: 5 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoUserAuth = getMongoModel<UserAuthSchemaType>('auth_code', UserAuthSchema);
