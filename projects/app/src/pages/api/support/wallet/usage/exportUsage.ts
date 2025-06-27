import type { NextApiResponse } from 'next';
import { responseWriteController } from '@fastgpt/service/common/response';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { addDays } from 'date-fns';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import dayjs from 'dayjs';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { getTeamMembers } from '@/service/support/user/team/controller';
import { GetUsageProps } from '@fastgpt/global/support/wallet/usage/api';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';
import { NextAPI } from '@/service/middleware/entry';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { sanitizeCsvField } from '@fastgpt/service/common/file/csv';

const getAppName = (appName: string, appNameMap: Record<string, string>) =>
  appName in appNameMap ? appNameMap[appName] : appName;

export type ExportUsageBody = GetUsageProps & {
  appNameMap: Record<string, string>;
  sourcesMap: Record<string, { label: string }>;
  title: string;
};

async function handler(req: ApiRequestProps<ExportUsageBody, {}>, res: NextApiResponse) {
  let {
    dateStart = addDays(new Date(), -7),
    dateEnd = new Date(),
    sources,
    teamMemberIds,
    sourcesMap,
    appNameMap,
    title,
    projectName
  } = req.body;

  const { teamId, tmbId, permission } = await authUserPer({
    req,
    authToken: true,
    per: ReadPermissionVal
  });

  const where = {
    teamId,
    time: {
      $gte: new Date(dateStart),
      $lte: new Date(dateEnd)
    },
    // 非管理员只能看自己。管理员可以看所有人或者指定人。
    ...(permission.hasManagePer
      ? teamMemberIds
        ? {
            tmbId: { $in: teamMemberIds }
          }
        : {}
      : { tmbId }),
    ...(sources && { source: sources }),
    ...(projectName && {
      appName: { $regex: new RegExp(`${replaceRegChars(projectName)}`, 'i') }
    })
  };

  const teamMembers = await getTeamMembers(teamId);
  const teamMemberMap = teamMembers.reduce<Record<string, string>>((acc, member) => {
    acc[member.tmbId] = member.memberName;
    return acc;
  }, {});

  res.setHeader('Content-Type', 'text/csv; charset=utf-8;');
  res.setHeader('Content-Disposition', 'attachment; filename=usage.csv; ');

  // get bill record and total by record
  const cursor = MongoUsage.find(where, 'tmbId source appName time totalPoints', {
    ...readFromSecondary,
    batchSize: 1000
  })
    .sort({ _id: -1 })
    .limit(50000)
    .cursor();

  const write = responseWriteController({
    res,
    readStream: cursor
  });

  write(`\uFEFF${title}`);

  cursor.on('data', (doc) => {
    const time = dayjs(doc.time.toISOString()).format('YYYY-MM-DD HH:mm:ss');
    const memberName = teamMemberMap[doc.tmbId.toString()];
    const source = sourcesMap[doc.source as UsageSourceEnum]?.label;
    const appName = getAppName(doc.appName, appNameMap);
    const totalPoints = doc.totalPoints;

    const sanitizedTime = sanitizeCsvField(time);
    const sanitizedMemberName = sanitizeCsvField(memberName);
    const sanitizedSource = sanitizeCsvField(source);
    const sanitizedAppName = sanitizeCsvField(appName);
    const sanitizedTotalPoints = sanitizeCsvField(totalPoints);

    const res = `\n${sanitizedTime},${sanitizedMemberName},${sanitizedSource},${sanitizedAppName},${sanitizedTotalPoints}`;

    write(res);
  });

  cursor.on('end', () => {
    cursor.close();
    res.end();

    (async () => {
      addAuditLog({
        tmbId,
        teamId,
        event: AuditEventEnum.EXPORT_BILL_RECORDS,
        params: {}
      });
    })();
  });

  cursor.on('error', (err) => {
    addLog.error(`export usage error`, err);
    res.status(500);
    res.end();
  });
}

export default NextAPI(
  useIPFrequencyLimit({ id: 'export-usage', seconds: 60, limit: 1, force: true }),
  handler
);
