import { listBody } from '@/pages/api/admin/common/log/list';
import { POST } from '@/service/common/request';
import { PagingData } from '@/types';
import { SystemLogType } from '@fastgpt/service/common/system/log/type';

export const getSystemLogList = (data: listBody) =>
  POST<PagingData<SystemLogType>>('/admin/common/log/list', data);
