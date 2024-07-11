import { connectionMongo, getMongoModel, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import type { UserInformSchema } from '@fastgpt/global/support/user/inform/type';
import { InformLevelEnum, InformLevelMap } from '@fastgpt/global/support/user/inform/constants';

const InformSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  time: {
    type: Date,
    default: () => new Date()
  },
  level: {
    type: String,
    enum: Object.keys(InformLevelMap),
    default: InformLevelEnum.common
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
});

try {
  InformSchema.index({ userId: 1, time: -1 });
  InformSchema.index({ time: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoUserInform = getMongoModel<UserInformSchema>('inform', InformSchema);
