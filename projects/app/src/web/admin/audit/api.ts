import { GET, POST } from '@/service/common/request';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { OperationListItemType } from '@fastgpt/global/support/user/audit/type';
import type { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

export const getOperationLogs = (
  props: PaginationProps & {
    tmbIds?: string[];
    events?: AdminAuditEventEnum[];
  }
) => POST<PaginationResponse<OperationListItemType>>('/support/user/audit/adminList', props);
