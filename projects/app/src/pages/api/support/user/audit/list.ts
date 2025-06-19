import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoOperationLog } from '@fastgpt/service/support/user/audit/schema';
import { NextAPI } from '@/service/middleware/entry';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { addSourceMember } from '@fastgpt/service/support/user/utils';
import { OperationListItemType } from '@fastgpt/global/support/user/audit/type';
import { AdminAuditEventEnum, AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

type OperationLogQuery = {
  pageNum?: number;
  pageSize?: number;
  tmbIds?: string[];
  events?: AuditEventEnum[];
};
type OperationLogBody = {};

async function handler(
  req: ApiRequestProps<OperationLogBody, OperationLogQuery>,
  res: ApiResponseType<any>
): Promise<PaginationResponse<OperationListItemType>> {
  const { teamId } = await authCert({ req, authToken: true });

  const {
    pageNum = 1,
    pageSize = 20,
    tmbIds,
    events
  } = req.body as {
    pageNum: number;
    pageSize: number;
    tmbIds?: string[];
    events?: AuditEventEnum[];
  };

  const filter: Record<string, any> = {
    teamId,
    ...(tmbIds ? { tmbId: { $in: tmbIds } } : { tmbId: { $exists: true } }),
    ...(events
      ? { event: { $in: events } }
      : {
          event: { $nin: Object.values(AdminAuditEventEnum) }
        })
  };

  const [logs, total] = await Promise.all([
    MongoOperationLog.find(filter, '_id tmbId timestamp event metadata', {
      ...readFromSecondary
    })
      .sort({ _id: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    MongoOperationLog.countDocuments(filter, { ...readFromSecondary })
  ]);

  const logsWithMembers = await addSourceMember({
    list: logs
  });

  const list = logsWithMembers.map<OperationListItemType>((log) => {
    return {
      _id: log._id,
      sourceMember: log.sourceMember,
      event: log.event,
      metadata: {
        ...log.metadata,
        name: log.sourceMember.name
      },
      timestamp: log.timestamp
    };
  });

  return {
    list,
    total
  };
}

export default NextAPI(handler);
