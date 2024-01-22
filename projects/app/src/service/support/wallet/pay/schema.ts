import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { PaySchema as PayType } from '@fastgpt/global/support/wallet/pay/type.d';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';
import { payStatusMap, payTypeMap } from '@fastgpt/global/support/wallet/pay/constants';

const PaySchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  tmbId: {
    type: Schema.Types.ObjectId,
    ref: TeamMemberCollectionName,
    required: true
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    default: 'NOTPAY',
    enum: Object.keys(payStatusMap)
  },
  type: {
    type: String,
    enum: Object.keys(payTypeMap),
    required: true
  },

  price: {
    // total price
    type: Number,
    required: true
  }
});

try {
  PaySchema.index({ createTime: 1 }, { background: true });
  PaySchema.index({ status: 1 }, { background: true });
  PaySchema.index({ type: 1 }, { background: true });
  PaySchema.index({ teamId: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoPay: Model<PayType> = models['pay'] || model('pay', PaySchema);
