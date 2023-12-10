import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import {
  delFileByFileIdList,
  getFileById,
  getGFSCollection
} from '@fastgpt/service/common/file/gridfs/controller';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { delay } from '@fastgpt/global/common/system/utils';
import { addDays } from 'date-fns';
import { MongoImage } from '@fastgpt/service/common/file/image/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

/* 
  check dataset.files data. If there is no match in dataset.collections, delete it
  可能异常情况
  1. 上传文件，未创建集合
  2. 删除集合/知识库，未成功删除文件
*/
let deleteFileAmount = 0;
let deleteImageAmount = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      startDay = 10,
      endDay = 3,
      limit = 30
    } = req.body as { startDay?: number; endDay?: number; limit?: number };
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // start: now - maxDay, end: now - 3 day
    const start = addDays(new Date(), -startDay);
    const end = addDays(new Date(), -endDay);
    deleteFileAmount = 0;
    deleteImageAmount = 0;

    await checkFiles(start, end, limit);
    await checkImgs(start, end, limit);

    jsonRes(res, {
      message: 'success'
    });
  } catch (error) {
    addLog.error(`check valid dataset files error`, error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export async function checkFiles(start: Date, end: Date, limit: number) {
  const collection = getGFSCollection('dataset');
  const where = {
    uploadDate: { $gte: start, $lte: end }
  };

  // 1. get all _id
  const ids = await collection
    .find(where, {
      projection: {
        _id: 1
      }
    })
    .toArray();
  console.log('total files', ids.length);

  for (let i = 0; i < limit; i++) {
    check(i);
  }

  async function check(index: number, retry = 3): Promise<any> {
    const id = ids[index];
    if (!id) {
      console.log(`检测完成，共删除 ${deleteFileAmount} 个无效文件`);

      return;
    }
    try {
      const { _id } = id;

      // 2. find fileId in dataset.collections
      const hasCollection = await MongoDatasetCollection.countDocuments({ fileId: _id });

      // 3. if not found, delete file
      if (hasCollection === 0) {
        await delFileByFileIdList({ bucketName: 'dataset', fileIdList: [String(_id)] });
        console.log('delete file', _id);
        deleteFileAmount++;
      }
      index % 100 === 0 && console.log(index);
      return check(index + limit);
    } catch (error) {
      console.log(error);
      if (retry > 0) {
        await delay(2000);
        return check(index, retry - 1);
      }
      return Promise.reject(error);
    }
  }
}

export async function checkImgs(start: Date, end: Date, limit: number) {
  const where = {
    createTime: { $gte: start, $lte: end }
  };

  // 1. get all images
  const images = await MongoImage.find(where, '_id metadata');
  console.log('total files', images.length);

  for (let i = 0; i < limit; i++) {
    check(i);
  }

  async function check(index: number, retry = 3): Promise<any> {
    const image = images[index];
    if (!image) {
      console.log(`检测完成，共删除 ${deleteImageAmount} 个无效图片`);
      return;
    }
    if (!image?.metadata?.fileId) {
      return;
    }

    try {
      const fileId = image.metadata.fileId;

      // 2. find dataset
      const file = await getFileById({ bucketName: 'dataset', fileId });

      // 3. if not found, delete file
      if (!file) {
        await MongoImage.findByIdAndRemove(image._id);
        deleteImageAmount++;
      }
      index % 100 === 0 && console.log(index);
      return check(index + limit);
    } catch (error) {
      console.log(error);
      if (retry > 0) {
        await delay(2000);
        return check(index, retry - 1);
      }
      return Promise.reject(error);
    }
  }
}
