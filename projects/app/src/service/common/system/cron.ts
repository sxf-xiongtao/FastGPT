import { setCron } from '@fastgpt/service/common/system/cron';
import { startTrainingProcess } from '@/service/core/dataset/training/utils';

export const startCron = () => {
  setTrainingCron();
};

export const setTrainingCron = () => {
  setCron('*/1 * * * *', () => {
    for (let i = 0; i < 10; i++) {
      startTrainingProcess();
    }
  });
};
