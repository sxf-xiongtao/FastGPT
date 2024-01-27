import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import * as nodemailer from 'nodemailer';
import Dysmsapi, * as dysmsapi from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import { connectToDatabase } from '@/service/mongo';
import { MongoAuthCode } from '@/service/support/user/authCode/schema';
import axios from 'axios';
import { customAlphabet } from 'nanoid';
import requestIp from 'request-ip';
import { Obj2Query } from '@/utils/tools';
import { addMinutes } from 'date-fns';
const nanoid = customAlphabet('123456789', 6);

enum UserAuthTypeEnum {
  register = 'register',
  findPassword = 'findPassword'
}

const expiredMinute = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { username, type, googleToken } = req.body as {
      username: string;
      type: `${UserAuthTypeEnum}`;
      googleToken: string;
    };

    await connectToDatabase();

    if (!username || !type) {
      throw new Error('缺少参数');
    }

    // google auth
    global.systemConfig?.auth?.googleServiceVerKey &&
      (await authGoogleToken({
        secret: global.systemConfig?.auth?.googleServiceVerKey,
        response: googleToken,
        remoteip: requestIp.getClientIp(req) || undefined
      }));

    // 判断 1 分钟内是否有重复数据
    const authCode = await MongoAuthCode.findOne({
      username,
      type,
      time: { $gte: addMinutes(Date.now(), -1) }
    });

    if (authCode) {
      throw new Error('请勿频繁获取验证码');
    }

    const code = nanoid();

    // 创建 auth 记录
    await MongoAuthCode.create({
      username,
      type,
      code
    });

    if (username.includes('@')) {
      await sendEmailCode(username, code, type);
    } else {
      // 发送验证码
      await sendPhoneCode(username, code);
    }

    jsonRes(res, {
      message: '发送验证码成功'
    });
  } catch (err: any) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export const sendEmailCode = (email: string, code: string, type: `${UserAuthTypeEnum}`) => {
  const emailMap: { [key: string]: any } = {
    [UserAuthTypeEnum.register]: {
      subject: `注册 ${global.systemConfig?.system?.title} 账号`,
      html: (code: string) =>
        `<div>您正在注册 ${global.systemConfig?.system?.title} 账号，验证码为：${code}</div>`
    },
    [UserAuthTypeEnum.findPassword]: {
      subject: `修改 ${global.systemConfig?.system?.title} 密码`,
      html: (code: string) =>
        `<div>您正在修改 ${global.systemConfig?.system?.title} 账号密码，验证码为：${code}</div>`
    }
  };

  const mailTransport = nodemailer.createTransport({
    // host: 'smtp.qq.phone',
    service: global.systemConfig?.auth?.email?.service,
    secure: true, //安全方式发送,建议都加上
    auth: {
      user: global.systemConfig?.auth?.email?.user,
      pass: global.systemConfig?.auth?.email?.pass
    }
  });

  return new Promise((resolve, reject) => {
    const options = {
      from: `"${global.systemConfig?.system?.title}" ${global.systemConfig?.auth?.email?.user}`,
      to: email,
      subject: emailMap[type]?.subject,
      html: emailMap[type]?.html(code)
    };
    mailTransport.sendMail(options, function (err, msg) {
      if (err) {
        console.log('send email error->', err);
        reject('发生邮件异常');
      } else {
        resolve('');
      }
    });
  });
};

export const sendPhoneCode = async (phone: string, code: string) => {
  const accessKeyId = global.systemConfig?.auth?.phone?.SNED_PHONE_ACCESSKEYID;
  const accessKeySecret = global.systemConfig?.auth?.phone?.SNED_PHONE_ACCESSSECRET;
  const signName = global.systemConfig?.auth?.phone?.SNED_PHONE_SIGNNAME;
  const templateCode = global.systemConfig?.auth?.phone?.SNED_PHONE_TEMPLATE;
  const endpoint = 'dysmsapi.aliyuncs.com';

  const sendSmsRequest = new dysmsapi.SendSmsRequest({
    phoneNumbers: phone,
    signName,
    templateCode,
    templateParam: `{"code":${code}}`
  });

  const config = new OpenApi.Config({ accessKeyId, accessKeySecret, endpoint });
  const client = new Dysmsapi(config);
  const runtime = new Util.RuntimeOptions({});
  const res = await client.sendSmsWithOptions(sendSmsRequest, runtime);
  if (res.body.code !== 'OK') {
    return Promise.reject(res.body.message || '发送短信失败');
  }
};

export const authCode = async ({
  username,
  code,
  type
}: {
  username: string;
  code: string;
  type: `${UserAuthTypeEnum}`;
}) => {
  const result = await MongoAuthCode.findOne({
    username,
    type,
    code
  });

  if (!result) {
    return Promise.reject('验证码错误');
  }

  return 'SUCCESS';
};

// service run
export const authGoogleToken = async (data: {
  secret: string;
  response: string;
  remoteip?: string;
}) => {
  const res = await axios.post<{
    score?: number;
    success: boolean;
    'error-codes': string[];
  }>(`https://www.recaptcha.net/recaptcha/api/siteverify?${Obj2Query(data)}`);

  if (res.data.success) {
    return Promise.resolve('');
  }
  return Promise.reject(res?.data?.['error-codes']?.[0] || '非法环境');
};
