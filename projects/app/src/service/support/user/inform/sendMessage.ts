import * as nodemailer from 'nodemailer';
import Dysmsapi, * as dysmsapi from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { getMessageTemplate, MessageTemplateParamsType } from './constants';
import { RequireOnlyOne } from '@fastgpt/global/common/type/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { SendInformTemplateCodeEnum } from '@fastgpt/global/support/user/inform/constants';
import axios from 'axios';

export type SendEmailProps = {
  email: string;
  subject: string;
  html: string;
};
export async function sendEmail({ email, subject, html }: SendEmailProps) {
  const mailTransport = nodemailer.createTransport({
    host: global.systemConfig?.auth?.email?.smtp,
    secure: true, //安全方式发送,建议都加上
    port: 465,
    auth: {
      user: global.systemConfig?.auth?.email?.user,
      pass: global.systemConfig?.auth?.email?.pass
    }
  });

  const options = {
    from: `"${global.feConfigs?.systemTitle}" ${global.systemConfig?.auth?.email?.user}`,
    to: email,
    subject,
    html
  };

  return mailTransport.sendMail(options).catch((err) => {
    addLog.error('sendEmail error', err);
    return Promise.reject(err);
  });
}

const smsConfig = global.systemConfig?.auth?.sms;
type SMSTemplateKeys = keyof NonNullable<typeof smsConfig>;
type SMSTemplateParamsMap = {
  EXPIRE_SOON: {
    name: string;
    sub: string;
    day: number;
  };

  EXPIRED: {
    name: string;
    sub: string;
  };

  FREE_CLEAN: {
    name: string;
    date: string;
  };

  FREE_CLEANED: {
    name: string;
  };
} & {
  [key in 'REGISTER' | 'RESET_PASSWORD' | 'BIND_NOTIFICATION']: {
    code: string;
  };
};
export async function sendSms({
  phone,
  templateCode,
  templateParam
}: {
  phone: string;
  templateCode: string; // do not use SendInformTemplateCodeEnum here, use smsConfig values directly
  templateParam: SMSTemplateParamsMap[SMSTemplateKeys];
}) {
  const accessKeyId = global.systemConfig?.auth?.phone?.SNED_PHONE_ACCESSKEYID;
  const accessKeySecret = global.systemConfig?.auth?.phone?.SNED_PHONE_ACCESSSECRET;
  const signName = global.systemConfig?.auth?.phone?.SNED_PHONE_SIGNNAME;
  const endpoint = 'dysmsapi.aliyuncs.com';

  if (process.env.SMS_PROXY) {
    return axios.post(process.env.SMS_PROXY, {
      accessKeyId,
      accessKeySecret,
      signName,
      endpoint,

      templateCode,
      phone,
      templateParam
    });
  }

  const sendSmsRequest = new dysmsapi.SendSmsRequest({
    phoneNumbers: phone,
    signName,
    templateCode: templateCode,
    templateParam: JSON.stringify(templateParam)
  });

  const config = new OpenApi.Config({ accessKeyId, accessKeySecret, endpoint });
  const client = new Dysmsapi(config);
  const runtime = new Util.RuntimeOptions({});
  const res = await client.sendSmsWithOptions(sendSmsRequest, runtime);
  if (res.body.code !== 'OK') {
    addLog.error('sendSms error', res.body);
    return Promise.reject(res.body.message || '发送短信失败');
  }
}

type _sendMessageProps<Key extends SendInformTemplateCodeEnum> = {
  teamId: string; // teamID
  target: string; // email or phone
  templateCode: `${Key}`;
  templateParam: MessageTemplateParamsType<Key>;
  forceSend?: boolean; // ignore lock and queue
};
export type sendMessageProps<Key extends SendInformTemplateCodeEnum> = RequireOnlyOne<
  _sendMessageProps<Key>,
  'target' | 'teamId'
>;

// send message to user after checking the lock. Choose email or sms automatically.
export async function sendMessage<Key extends SendInformTemplateCodeEnum>({
  teamId,
  target: targetParam,
  templateCode,
  templateParam
}: sendMessageProps<Key>) {
  if (!teamId && !targetParam) {
    return Promise.reject('Wrong teamId or target');
  }

  const { target, name } = await (async () => {
    if (teamId) {
      const team = (await MongoTeam.findById(teamId).lean())!;

      return {
        target: team?.notificationAccount,
        name: team.name
      };
    }

    return {
      target: targetParam,
      name: targetParam
    };
  })();

  if (!target) {
    return;
  }

  const { emailTemplate, smsTemplateCode } = getMessageTemplate(templateCode);

  if (target.includes('@') && emailTemplate) {
    console.log({
      teamId,
      ...emailTemplate?.({ name, ...templateParam }),
      email: target
    });
    await sendEmail({
      ...emailTemplate({ name, ...templateParam }),
      email: target
    });
  } else if (smsTemplateCode) {
    // 去除所有空格
    const formatName = name ? name.replace(/ /g, '') : 'FastGPT用户';
    console.log({
      templateCode: smsTemplateCode(),
      templateParam: {
        name: formatName,
        ...templateParam
      },
      phone: target
    });
    await sendSms({
      templateCode: smsTemplateCode(),
      templateParam: {
        name: formatName,
        ...templateParam
      },
      phone: target
    });
  }
}
