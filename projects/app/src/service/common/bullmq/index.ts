import { addLog } from '@fastgpt/service/common/system/log';
import { initDatasetSyncWorker } from '@/service/core/dataset/dataset/sync';

export const initBullMQWorkers = () => {
  addLog.info('Init BullMQ Workers...');
  initDatasetSyncWorker();
};
