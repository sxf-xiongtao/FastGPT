import axios from 'axios';
import * as nodeCron from 'node-cron';

const instance = () =>
  axios.create({
    baseURL: `${process.env.PRO_URL}/api/timeTasks`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      rootkey: process.env.PRO_ROOT_KEY
    }
  });

export const registerCron = () => {
  // checkInvalidFiles();
  // every day to check invalid user
  nodeCron.schedule('0 0 * * *', checkInvalidUser);
  // every day to check invalid images
  nodeCron.schedule('20 */12 * * *', checkInvalidImages);

  // every 6 hours to check invalid files
  nodeCron.schedule('0 */1 * * *', checkInvalidFiles);
  // every 6 hours to check invalid vector
  nodeCron.schedule('10 */1 * * *', checkInvalidVector);
  nodeCron.schedule('40 */1 * * *', checkInvalidMongoDatasetData);
};

const checkInvalidUser = () => {
  console.log('checkInvalidUser');
  instance()
    .request({
      url: '/user/checkInvalidUser',
      data: {
        startHour: 72,
        endHour: 24
      }
    })
    .then((res) => {
      console.log('invalid user', res.data?.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

const checkInvalidImages = () => {
  console.log('checkInvalidImages');
  instance()
    .request({
      url: '/dataset/checkInvalidDatasetImage',
      data: {
        startHour: 48,
        endHour: 12
      }
    })
    .then((res) => {
      console.log('invalid images', res.data?.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

const checkInvalidFiles = () => {
  console.log('checkInvalidFiles');
  instance()
    .request({
      url: '/dataset/checkInValidDatasetFiles',
      data: {
        startHour: 5,
        endHour: 1
      }
    })
    .then((res) => {
      console.log('invalid file', res.data?.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

const checkInvalidVector = () => {
  console.log('checkInvalidVector');
  instance()
    .request({
      url: '/dataset/checkInvalidVector',
      data: {
        startHour: 5,
        endHour: 1
      }
    })
    .then((res) => {
      console.log('InvalidVector', res.data?.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

const checkInvalidMongoDatasetData = () => {
  console.log('checkInvalidMongoDatasetData');
  instance()
    .request({
      url: '/dataset/checkInvalidDatasetData',
      data: {
        startHour: 5,
        endHour: 1
      }
    })
    .then((res) => {
      console.log('InvalidMongoDatasetData', res.data?.data);
    })
    .catch((err) => {
      console.log(err);
    });
};
