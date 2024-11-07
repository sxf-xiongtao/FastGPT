import { getWebReqUrl } from '@fastgpt/web/common/system/utils';

export const uploadImage = async (imageBase64: string) => {
  try {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(getWebReqUrl('/api/admin/common/file/uploadImage'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Token: token
      },
      body: JSON.stringify({
        base64Img: imageBase64
      })
    });

    if (response.ok) {
      const jsonData = await response.json();
      return jsonData.data;
    } else {
      console.error(`Request failed with status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

export const compressBase64ImgAndUpload = ({
  base64,
  maxW = 200,
  maxH = 200,
  maxSize = 1024 * 100, // 100kb
  expiredTime
}: {
  base64: string;
  maxW?: number;
  maxH?: number;
  maxSize?: number;
  expiredTime?: Date;
}) => {
  return new Promise<string>((resolve, reject) => {
    const fileType = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/.exec(base64)?.[1] || 'image/jpeg';

    const img = new Image();
    img.src = base64;
    img.onload = async () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxW) {
          height *= maxW / width;
          width = maxW;
        }
      } else {
        if (height > maxH) {
          width *= maxH / height;
          height = maxH;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject('压缩图片异常');
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL(fileType, 0.8);
      // 移除 canvas 元素
      canvas.remove();

      if (compressedDataUrl.length > maxSize) {
        return reject('图片太大了');
      }

      try {
        const src = await uploadImage(compressedDataUrl);
        resolve(src);
      } catch (error) {
        reject(error);
      }
    };
  });
};
export const compressImgFileAndUpload = async ({
  file,
  maxW,
  maxH,
  maxSize,
  expiredTime
}: {
  file: File;
  maxW?: number;
  maxH?: number;
  maxSize?: number;
  expiredTime?: Date;
}) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);

  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = async () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      console.log(err);
      reject('压缩图片异常');
    };
  });

  return compressBase64ImgAndUpload({
    base64,
    maxW,
    maxH,
    maxSize,
    expiredTime
  });
};
