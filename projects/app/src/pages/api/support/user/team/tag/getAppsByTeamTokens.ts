import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';

import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { authTokenFromTeamDomain } from '@/service/support/user/team/tagController';
import type { AuthTeamTagTokenProps } from '@fastgpt/global/support/user/team/tag';
import type { AppListItemType } from '@fastgpt/global/core/app/type';
import { AppDefaultPermissionVal } from '@fastgpt/global/support/permission/app/constant';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, teamToken } = req.query as AuthTeamTagTokenProps;

    const teamInfo = await MongoTeam.findById(teamId);
    const teamDomain = teamInfo?.teamDomain;

    if (!teamDomain) {
      throw new Error('The team is not using space to chat');
    }
    const userInfo = await authTokenFromTeamDomain(teamDomain, teamToken);

    const { tags } = userInfo;

    const apps = await MongoApp.find({
      teamId,
      type: { $in: [AppTypeEnum.simple, AppTypeEnum.workflow, AppTypeEnum.plugin] },
      teamTags: { $in: tags }
    })
      .sort({
        updateTime: -1
      })
      .lean();

    const tmbList = await MongoTeamMember.find({
      teamId,
      _id: { $in: apps.map((app) => app.tmbId) }
    }).lean();

    jsonRes<AppListItemType[]>(res, {
      data: apps.map((app) => {
        const tmb = tmbList.find((tmb) => String(tmb._id) === String(app.tmbId))!;
        return {
          _id: app._id,
          tmbId: app.tmbId,
          name: app.name,
          avatar: app.avatar,
          intro: app.intro,
          updateTime: app.updateTime,
          isOwner: false,
          defaultPermission: AppDefaultPermissionVal,
          type: app.type,
          permission: new AppPermission({ per: ReadPermissionVal }),
          inheritPermission: app.inheritPermission,
          sourceMember: {
            name: tmb.name,
            avatar: tmb.avatar,
            status: tmb.status
          }
        };
      })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
