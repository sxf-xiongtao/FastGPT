import { DatasetErrEnum } from '@fastgpt/global/common/error/code/dataset';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetCollectionTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { syncCollection } from '@fastgpt/service/core/dataset/collection/utils';
import { addDays } from 'date-fns';

export const syncCollectionTask = async () => {
  let selectedCollectionId = '';
  try {
    // 获取一条需要更新的集合，并且强制锁上
    const collection = await MongoDatasetCollection.findOneAndUpdate(
      {
        type: { $in: [DatasetCollectionTypeEnum.link, DatasetCollectionTypeEnum.apiFile] },
        nextSyncTime: { $lte: new Date() }
      },
      {
        $set: {
          nextSyncTime: addDays(new Date(), 1)
        }
      }
    )
      .populate<{ dataset: DatasetSchemaType }>('dataset')
      .lean();

    // 没有需要同步的 collection，结束任务
    if (!collection) {
      return;
    }
    selectedCollectionId = collection._id;

    // Sync collection
    const res = await syncCollection(collection);
    addLog.info('Sync collection success', { collectionId: collection._id, res });

    syncCollectionTask();
  } catch (error) {
    addLog.warn('Sync collection error', { error });

    if (selectedCollectionId && error === DatasetErrEnum.notSupportSync) {
      await MongoDatasetCollection.updateOne(
        { _id: selectedCollectionId },
        { $unset: { nextSyncTime: 1 } }
      );
    }

    await delay(2000);

    syncCollectionTask();
  }
};
