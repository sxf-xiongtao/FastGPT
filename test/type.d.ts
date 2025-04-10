import type mongoose from '@fastgpt/service/common/mongo';

declare global {
  var mongodb: mongoose.Mongoose;
}
