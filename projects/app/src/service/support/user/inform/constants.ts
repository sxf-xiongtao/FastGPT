import { SendInformTemplateCodeEnum } from '@fastgpt/global/support/user/inform/constants';
import type { EmailTemplateType } from './templates/emailTemplates';
import {
  CustomTemplate,
  expiredTemplate,
  expireSoonTemplate,
  FreeCleanTemplate,
  lackOfPointsTemplate,
  NotificationBindTemplate,
  RegisterTemplate,
  ResetPasswordTemplate,
  ManageRenameTemplate
} from './templates/emailTemplates';

import type { InformTemplateType } from './templates/informTemplates';
import {
  expiredTemplate as InformExpiredTemplate,
  expireSoonTemplate as InformExpireSoonTemplate,
  FreeCleanTemplate as InformFreeCleanTemplate,
  lackOfPointsTemplate as InformLackOfPointsTemplate,
  CustomTemplate as InformCustomTemplate,
  ManageRenameTemplate as InformManageRenameTemplate
} from './templates/informTemplates';

const MessageTemplateMap = {
  [SendInformTemplateCodeEnum.EXPIRE_SOON]: {
    emailTemplate: expireSoonTemplate,
    smsTemplateCode: () => global.systemConfig?.auth?.sms?.EXPIRE_SOON,
    getInformTemplate: InformExpireSoonTemplate,
    lockMinutes: 2 * 24 * 60, // 2 day
    isSendQueue: true
  },
  [SendInformTemplateCodeEnum.EXPIRED]: {
    emailTemplate: expiredTemplate,
    smsTemplateCode: () => global.systemConfig?.auth?.sms?.EXPIRED,
    getInformTemplate: InformExpiredTemplate,
    lockMinutes: 2 * 24 * 60,
    isSendQueue: true
  },
  [SendInformTemplateCodeEnum.FREE_CLEAN]: {
    emailTemplate: FreeCleanTemplate,
    smsTemplateCode: () => global.systemConfig?.auth?.sms?.FREE_CLEAN,
    getInformTemplate: InformFreeCleanTemplate,
    lockMinutes: 2 * 24 * 60,
    isSendQueue: true
  },
  [SendInformTemplateCodeEnum.REGISTER]: {
    emailTemplate: RegisterTemplate,
    smsTemplateCode: () => global.systemConfig?.auth?.sms?.REGISTER,
    getInformTemplate: undefined,
    lockMinutes: 1,
    isSendQueue: false
  },
  [SendInformTemplateCodeEnum.RESET_PASSWORD]: {
    emailTemplate: ResetPasswordTemplate,
    smsTemplateCode: () => global.systemConfig?.auth?.sms?.RESET_PASSWORD,
    getInformTemplate: undefined,
    lockMinutes: 1,
    isSendQueue: false
  },
  [SendInformTemplateCodeEnum.BIND_NOTIFICATION]: {
    emailTemplate: NotificationBindTemplate,
    smsTemplateCode: () => global.systemConfig?.auth?.sms?.BIND_NOTIFICATION,
    getInformTemplate: undefined,
    lockMinutes: 1,
    isSendQueue: false
  },
  [SendInformTemplateCodeEnum.LACK_OF_POINTS]: {
    emailTemplate: lackOfPointsTemplate,
    smsTemplateCode: undefined,
    getInformTemplate: InformLackOfPointsTemplate,
    lockMinutes: 60,
    isSendQueue: true
  },
  [SendInformTemplateCodeEnum.CUSTOM]: {
    emailTemplate: CustomTemplate,
    smsTemplateCode: undefined,
    getInformTemplate: InformCustomTemplate,
    lockMinutes: 1,
    isSendQueue: true
  },
  [SendInformTemplateCodeEnum.MANAGE_RENAME]: {
    emailTemplate: ManageRenameTemplate,
    smsTemplateCode: undefined,
    getInformTemplate: InformManageRenameTemplate,
    lockMinutes: 1,
    isSendQueue: false
  }
};

type MessageTemplateType<Key extends SendInformTemplateCodeEnum> =
  (typeof MessageTemplateMap)[Key]['emailTemplate'];

export type MessageTemplateParamsType<Key extends SendInformTemplateCodeEnum> = Omit<
  Parameters<MessageTemplateType<Key>>[0],
  'name'
> & {
  name?: string;
}; // name is optional because in sendMessage function, we can get the team name.

export function getMessageTemplate<Key extends SendInformTemplateCodeEnum>(key: `${Key}`) {
  return MessageTemplateMap[key] as {
    emailTemplate?: (params: MessageTemplateParamsType<Key>) => EmailTemplateType;
    smsTemplateCode?: () => string;
    getInformTemplate?: (params: MessageTemplateParamsType<Key>) => InformTemplateType;
    lockMinutes: number;
    isSendQueue: boolean;
  };
}
