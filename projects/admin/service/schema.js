import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const mongoUrl = process.env.MONGODB_URI;

if (!mongoUrl) {
  throw new Error('db error');
}

mongoose
  .connect(mongoUrl, {
    bufferCommands: true,
    maxPoolSize: 5,
    minPoolSize: 1,
    maxConnecting: 5
  })
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  avatar: {
    type: String,
    default: '/icon/human.png'
  },
  balance: {
    type: Number,
    default: 0
  },
  limit: {
    exportKbTime: {
      // Every half hour
      type: Date
    }
  }
});

// 新增: 定义 pays 模型
const paySchema = new mongoose.Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'teams',
    required: true
  },
  tmbId: {
    type: Schema.Types.ObjectId,
    ref: 'team.members',
    required: true
  },
  price: Number,
  orderId: String,
  status: String,
  createTime: Date,
  __v: Number
});

// 新增: 定义 kb 模型
const DatasetSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  avatar: String,
  name: String,
  tags: [String],
  updateTime: Date,
  __v: Number
});

const appSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  avatar: String,
  status: String,
  intro: String,
  share: {
    topNum: Number,
    isShare: Boolean,
    isShareDetail: Boolean,
    intro: String,
    collection: Number
  },
  security: {
    domain: [String],
    contextMaxLen: Number,
    contentMaxLen: Number,
    expiredTime: Number,
    maxLoadAmount: Number
  },
  updateTime: Date
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  avatar: {
    type: String,
    default: '/icon/logo.svg'
  },
  createTime: {
    type: Date,
    default: () => Date.now()
  },
  balance: {
    type: Number,
    default: 0
  },
  maxSize: {
    type: Number,
    default: 5
  }
});
const TeamMemberSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'teams',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  role: {
    type: String
  },
  status: {
    type: String
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  defaultTeam: {
    type: Boolean,
    default: false
  }
});

export const App = mongoose.models['app'] || mongoose.model('app', appSchema);
export const Dataset = mongoose.models['datasets'] || mongoose.model('datasets', DatasetSchema);
export const User = mongoose.models['user'] || mongoose.model('user', UserSchema);
export const Pay = mongoose.models['pay'] || mongoose.model('pay', paySchema);
export const MongoTeam = mongoose.models['team'] || mongoose.model('team', TeamSchema);
export const MongoTmb =
  mongoose.models['team.members'] || mongoose.model('team.members', TeamMemberSchema);
