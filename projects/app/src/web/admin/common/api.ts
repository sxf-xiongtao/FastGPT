import type { listBody } from '@/pages/api/admin/common/log/list';
import { GET, POST } from '@/service/common/request';
import type { SystemLogType } from '@fastgpt/service/common/system/log/type';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';

export const getSystemLogList = (data: listBody) =>
  POST<PaginationResponse<SystemLogType>>('/admin/common/log/list', data);
