import { retryRun } from '@fastgpt/global/common/fn/utils';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

// 定时同步集合
export const syncCollection = async (retry = 3) => {
  // 1. 获取当前需要同步的知识库
  const datasets = await retryRun(() => {
    return MongoDataset.find({
      syncSchedule: { $exists: true },
      syncNextTime: { $lte: new Date() }
    }).lean();
  });
  for await (const dataset of datasets) {
    try {
      if (!dataset.syncSchedule) continue;
    } catch (error) {}
  }
  // 2. 获取所有可同步集合的 id
  // 3. 逐一获取集合信息并进行同步
};
