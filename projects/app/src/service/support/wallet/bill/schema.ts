import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type.d';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';
import { billStatusMap, billTypeMap } from '@fastgpt/global/support/wallet/bill/constants';

const BillSchema = new Schema({
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
    enum: Object.keys(billStatusMap)
  },
  type: {
    type: String,
    enum: Object.keys(billTypeMap),
    required: true
  },
  price: {
    // total price. 1 * PRICE_SCALE = 1RMB
    type: Number,
    required: true
  },
  hasInvoice: { type: Boolean, default: false },
  metadata: {
    type: Object,
    required: true
  }
});

try {
  BillSchema.index({ status: 1, createTime: 1 });
  BillSchema.index({ teamId: 1, status: 1, type: 1, createTime: 1 });
} catch (error) {
  console.log(error);
}

export const MongoBill: Model<BillSchemaType> = models['pays'] || model('pays', BillSchema);
