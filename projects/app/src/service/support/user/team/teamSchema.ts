import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { TeamSchema as TeamType } from '@fastgpt/global/support/user/team/type.d';
import { userCollectionName } from '@fastgpt/service/support/user/schema';
import { PRICE_SCALE } from '@fastgpt/global/common/bill/constants';

export const TeamCollectionName = 'teams';

const TeamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: userCollectionName
  },
  avatar: {
    type: String,
    default: '/icon/logo.svg'
  },
  createTime: {
    type: Number,
    default: () => Date.now()
  },
  balance: {
    type: Number,
    default: 2 * PRICE_SCALE
  },
  maxSize: {
    type: Number,
    default: 1
  }
});

try {
} catch (error) {
  console.log(error);
}

export const MongoTeam: Model<TeamType> =
  models[TeamCollectionName] || model(TeamCollectionName, TeamSchema);
