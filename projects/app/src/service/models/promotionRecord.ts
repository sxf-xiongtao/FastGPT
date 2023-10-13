import { Schema, model, models, Model } from 'mongoose';
import { PromotionRecordSchema as PromotionRecordType } from '@/types/mongoSchema';
import { formatPrice } from '@/utils/user';

const PromotionRecordSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  objUId: {
    // 被邀请人
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: false
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  type: {
    type: String,
    required: true,
    enum: ['pay', 'register']
  },
  amount: {
    type: Number,
    required: true,
    set: (val: number) => formatPrice(val)
  }
});

export const MongoPromotionRecord: Model<PromotionRecordType> =
  models['promotionRecord'] || model('promotionRecord', PromotionRecordSchema);
