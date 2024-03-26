import { GET, POST } from '@/service/common/request';
import { SendInformProps } from '@fastgpt/global/support/user/inform/type.d';
import { SystemMsgModalValueType } from '@fastgpt/service/support/user/inform/type';

export const postSendSystemMsg = (data: SendInformProps) =>
  POST('/admin/support/user/inform/sendSystemInform', data);

export const getSystemMsgModal = () =>
  GET<SystemMsgModalValueType>('/support/user/inform/getSystemMsgModal');

export const postUpdateSystemMsgModal = (data: { content: string }) =>
  POST('/admin/support/user/inform/updateSystemModal', data);
