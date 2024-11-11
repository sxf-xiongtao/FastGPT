import { listBody } from '@/pages/api/admin/common/log/list';
import { GET, POST } from '@/service/common/request';
import { LicenseDataType, PagingData } from '@/types';
import { SystemLogType } from '@fastgpt/service/common/system/log/type';

export const getSystemLogList = (data: listBody) =>
  POST<PagingData<SystemLogType>>('/admin/common/log/list', data);

export const getLicenseData = () => GET<LicenseDataType>('/admin/common/license/auth');
