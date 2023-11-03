import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { PaySchema as PayType } from '@fastgpt/global/support/wallet/pay/type.d';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';

const PaySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
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
  price: {
    type: Number,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  status: {
    // 支付的状态
    type: String,
    default: 'NOTPAY',
    enum: ['SUCCESS', 'REFUND', 'NOTPAY', 'CLOSED']
  }
});

export const MongoPay: Model<PayType> = models['pay'] || model('pay', PaySchema);
