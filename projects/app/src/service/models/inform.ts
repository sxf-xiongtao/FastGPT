import { Schema, model, models, Model } from 'mongoose';
import { informSchema } from '@/types/mongoSchema';

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
  type: {
    type: String,
    enum: ['system']
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
  InformSchema.index({ time: -1 });
  InformSchema.index({ userId: 1 });
} catch (error) {
  console.log(error);
}

export const MongoInform: Model<informSchema> = models['inform'] || model('inform', InformSchema);
