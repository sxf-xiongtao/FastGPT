import { User, Pay, MongoTeam, MongoTmb } from '../schema.js';
import dayjs from 'dayjs';
import { auth } from './system.js';
import crypto from 'crypto';
import { Types } from 'mongoose';
export const PRICE_SCALE = 100000;

export const formatPrice = (val = 0, multiple = 1) => {
  return Number(((val / PRICE_SCALE) * multiple).toFixed(10));
};

// 加密
const hashPassword = (psw) => {
  return crypto.createHash('sha256').update(psw).digest('hex');
};

const day = 60;

export const useUserRoute = (app) => {
  // 统计近 30 天注册用户数量
  app.get('/users/data', auth(), async (req, res) => {
    try {
      let startCount = await User.countDocuments({
        createTime: { $lt: new Date(Date.now() - day * 24 * 60 * 60 * 1000) }
      });
      const usersRaw = await User.aggregate([
        { $match: { createTime: { $gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: {
              year: { $year: '$createTime' },
              month: { $month: '$createTime' },
              day: { $dayOfMonth: '$createTime' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' } },
            count: 1
          }
        },
        { $sort: { date: 1 } }
      ]);

      const countResult = usersRaw.map((item) => {
        const increaseRate = `${((item.count / startCount) * 100).toFixed(2)}%`;
        startCount += item.count;
        return {
          date: item.date,
          count: startCount,
          increase: item.count,
          increaseRate
        };
      });

      res.json(countResult);
    } catch (err) {
      console.log(`Error fetching users: ${err}`);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  // 获取用户列表
  app.get('/users', auth(), async (req, res) => {
    try {
      const start = parseInt(req.query._start) || 0;
      const end = parseInt(req.query._end) || 20;
      const order = req.query._order === 'DESC' ? -1 : 1;
      const sort = req.query._sort === 'id' ? '_id' : req.query._sort || '_id';
      const username = req.query.username || '';

      const where = username
        ? {
            username: new RegExp(username, 'i')
          }
        : {};

      const usersRaw = await User.find(where)
        .skip(start)
        .limit(end - start)
        .sort({ [sort]: order });
      const tmbs = await MongoTmb.find({
        userId: { $in: usersRaw.map((user) => user._id) }
      });

      // get teams
      const teams = await MongoTeam.find({
        _id: { $in: tmbs.map((tmb) => tmb.teamId) }
      });

      const users = tmbs.map((tmb, i) => {
        const user = usersRaw
          .find((user) => user._id.toString() === tmb.userId.toString())
          .toObject();
        const team = teams.find((team) => team._id.toString() === tmb.teamId.toString()).toObject();

        return {
          id: tmb._id,
          username: user.username,
          balance: formatPrice(team.balance),
          teamName: team.name,
          maxSize: team.maxSize,
          createTime: dayjs(user.createTime).format('YYYY/MM/DD HH:mm'),
          password: ''
        };
      });

      const totalCount = await User.countDocuments(where);

      res.header('Access-Control-Expose-Headers', 'X-Total-Count');
      res.header('X-Total-Count', totalCount);
      res.json(users);
    } catch (err) {
      console.log(`Error fetching users: ${err}`);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  // 创建用户
  app.post('/users', auth(), async (req, res) => {
    try {
      const { username, password, balance, teamName, maxSize } = req.body;
      if (!username || !password || !balance) {
        return res.status(400).json({ message: '缺少字段' });
      }

      const existingUser = await User.findOne({ username });

      if (existingUser) {
        // check team
        const tmb = await MongoTmb.findOne({ userId: existingUser._id });
        if (tmb) {
          return res.status(400).json({ message: '用户已注册' });
        }
      }

      const userId = await (async () => {
        if (existingUser) {
          return existingUser._id;
        }
        const { _id } = await User.create({
          username,
          password: hashPassword(hashPassword(password))
        });
        return _id;
      })();

      const ownerTeam = await MongoTeam.findOne({ ownerId: userId });

      const teamId = await (async () => {
        if (ownerTeam) {
          return ownerTeam._id;
        }
        const { _id } = await MongoTeam.create({
          ownerId: userId,
          name: teamName || 'My Team',
          maxSize,
          balance: balance * PRICE_SCALE
        });
        return _id;
      })();

      await MongoTmb.create({
        teamId,
        userId,
        role: 'owner',
        status: 'active',
        defaultTeam: true
      });

      res.json();
    } catch (err) {
      console.log(`Error creating user: ${err}`);
      res.status(500).json({ message: `创建用户失败, ${err?.message}` });
    }
  });
  // 修改用户信息
  app.put('/users/:id', auth(), async (req, res) => {
    try {
      const tmbId = req.params.id;

      let { username, password, balance, maxSize, teamName } = req.body;

      const tmb = await MongoTmb.findById(tmbId);

      const result = await User.findByIdAndUpdate(tmb.userId, {
        ...(username && { username }),
        ...(password && { password: hashPassword(hashPassword(password)) })
      });

      await MongoTeam.findByIdAndUpdate(tmb.teamId, {
        ...(teamName && { name: teamName }),
        ...(balance !== undefined && { balance: balance * PRICE_SCALE }),
        ...(maxSize !== undefined && { maxSize })
      });

      res.json({
        ...result.toObject(),
        ...(balance && { balance: formatPrice(balance * PRICE_SCALE) })
      });
    } catch (err) {
      console.log(`Error updating user: ${err}`);
      res.status(500).json({ message: `更新用户失败,${err?.message}` });
    }
  });

  // 获取 pays 列表
  app.get('/pays', auth(), async (req, res) => {
    try {
      const start = parseInt(req.query._start) || 0;
      const end = parseInt(req.query._end) || 20;
      const order = req.query._order === 'ASC' ? 1 : -1;
      const sort = req.query._sort === 'id' ? '_id' : req.query._sort || '_id';
      const tmbId = req.query.tmbId || '';
      const where = tmbId ? { tmbId } : {};

      const paysRaw = await Pay.find(where)
        .skip(start)
        .limit(end - start)
        .sort({ [sort]: order })
        .populate('tmbId')
        .lean();

      const pays = await Promise.all(
        paysRaw
          .filter((item) => item.tmbId)
          .map(async (item) => {
            const user = await User.findById(item.tmbId.userId, 'username');

            return {
              id: item._id.toString(),
              username: user.username,
              price: item.price / PRICE_SCALE,
              orderId: item.orderId,
              status: item.status,
              createTime: dayjs(item.createTime).format('YYYY/MM/DD HH:mm')
            };
          })
      );

      const totalCount = await Pay.countDocuments(where);

      res.header('Access-Control-Expose-Headers', 'X-Total-Count');
      res.header('X-Total-Count', totalCount);

      return res.json(pays);
    } catch (err) {
      console.log(`Error fetching pays: ${err}`);
      res.status(500).json({ message: 'Error fetching pays', details: err.message });
    }
  });
  // 获取本月账单
  app.get('/pays/data', auth(), async (req, res) => {
    try {
      let startCount = 0;

      const paysRaw = await Pay.aggregate([
        {
          $match: {
            status: 'SUCCESS',
            createTime: {
              $gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000) // 补时差
            }
          }
        },
        {
          $addFields: {
            adjustedCreateTime: { $add: ['$createTime', 8 * 60 * 60 * 1000] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$adjustedCreateTime' },
              month: { $month: '$adjustedCreateTime' },
              day: { $dayOfMonth: '$adjustedCreateTime' }
            },
            count: { $sum: '$price' }
          }
        },
        {
          $project: {
            _id: 0,
            date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' } },
            count: 1
          }
        },
        { $sort: { date: 1 } }
      ]);

      const countResult = paysRaw.map((item) => {
        startCount += item.count;
        return {
          date: item.date,
          total: startCount,
          count: item.count
        };
      });

      res.json(countResult);
    } catch (err) {
      console.log(`Error fetching users: ${err}`);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
};
