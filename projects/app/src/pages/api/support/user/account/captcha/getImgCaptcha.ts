import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { createCanvas, Canvas, DOMMatrix } from 'canvas';
import { MongoUserAuth } from '@/service/support/user/auth/schema';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';

export type getImgCaptchaQuery = {
  username: string;
};

export type captchaBody = {};

export type getImgCaptchaResponse = { captchaImage: string };

async function handler(
  req: ApiRequestProps<captchaBody, getImgCaptchaQuery>,
  res: ApiResponseType<any>
): Promise<getImgCaptchaResponse> {
  const canvas = createCanvas(400, 200);
  const context = canvas.getContext('2d');
  context.fillStyle = getRandomColor();
  context.fillRect(0, 0, canvas.width, canvas.height);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  let answer = '',
    tempLetter = '';

  for (let i = 0; i < 6; i++) {
    const fontFamilies = [
      'Arial',
      'Bradley Hand ITC',
      'Century',
      'Century Gothic',
      'Comic Sans MS',
      'Courier',
      'Courier New',
      'Cursive',
      'fantasy',
      'Georgia',
      'Lucida Sans Unicode',
      'Papyrus',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'serif',
      'sans-serif',
      'monospace',
      'cursive',
      'fantasy'
    ];
    const randomFontSize = `${65 + 60 * Math.random()}px`;
    const randomFontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
    context.font = randomFontSize + ' ' + randomFontFamily;
    context.fillStyle = getRandomColor();
    tempLetter = generateCaptchaText();
    answer += tempLetter;
    context.rotate(-0.7 + Math.random() * 1.2);
    context.setTransform(
      new DOMMatrix([
        Math.random() * 0.12 + 0.88,
        Math.random() * 0.25,
        Math.random() * 0.25,
        Math.random() * 0.15 + 0.85,
        Math.random() * 0.25,
        Math.random() * 0.25
      ])
    );
    context.fillText(tempLetter, 10 + (50 + Math.random() * 5) * i, 75);
    context.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0]));
  }
  for (let i = 0; i < 3; i++) {
    context.beginPath();
    context.moveTo(Math.random() * 20, Math.random() * 200);
    for (let j = 0; j < 5; j++) {
      const curveX = 10 + (45 + Math.random() * 15) * j + Math.random() * 30;
      const curveY = 75 + Math.random() * 30;
      const endX = 75 * j + Math.random() * 25 * j;
      const endY = Math.random() * 200;
      context.bezierCurveTo(curveX, curveY, curveX + 10, curveY + 10, endX, endY);
    }
    context.lineWidth = Math.random() * 3;
    context.strokeStyle = getRandomColor();
    context.stroke();
  }
  for (let i = 0; i < 6; i++) {
    context.beginPath();
    context.moveTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    context.lineTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    context.lineWidth = Math.random() * 3;
    context.strokeStyle = getRandomColor();
    context.stroke();
  }
  adjustGlobalContrast(canvas, 0.4);

  await MongoUserAuth.updateOne(
    {
      key: req.query.username,
      type: UserAuthTypeEnum.captcha
    },
    {
      code: answer,
      createTime: new Date() // reset time
    },
    {
      upsert: true
    }
  );
  const imageSrc = canvas.toDataURL();

  return {
    captchaImage: imageSrc
  };
}

export default NextAPI(handler);

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function generateCaptchaText() {
  const chars = '123456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  return chars[Math.floor(Math.random() * chars.length)];
}

function adjustGlobalContrast(canvas: Canvas, contrast: number) {
  const context = canvas.getContext('2d');

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = (r - 128) * contrast + 128;
    data[i + 1] = (g - 128) * contrast + 128;
    data[i + 2] = (b - 128) * contrast + 128;
  }

  context.putImageData(imageData, 0, 0);
}
