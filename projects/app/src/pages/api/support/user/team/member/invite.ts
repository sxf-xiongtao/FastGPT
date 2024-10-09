import type { NextApiResponse } from 'next';
import { authUserExistTeam } from '@/service/support/user/team/controller';
import type {
  InviteMemberProps,
  InviteMemberResponse
} from '@fastgpt/global/support/user/team/controller.d';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { authUserExist } from '@fastgpt/service/support/user/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { checkTeamMaxMembersPermission } from '@/service/support/permission/teamLimit';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { authMember } from '@/service/support/permission/team/auth';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addMemberToGroup } from '@/service/support/permission/group/controllers';
import { getTeamDefaultGroup } from '@fastgpt/service/support/permission/memberGroup/controllers';

async function handler(
  req: ApiRequestProps<InviteMemberProps>,
  _res: NextApiResponse
): Promise<InviteMemberResponse> {
  const { usernames } = req.body as InviteMemberProps;

  const { teamId } = await (() => {
    return authMember({ req, authToken: true, per: ManagePermissionVal });
  })();

  let userMap: InviteMemberResponse = {
    invite: [],
    inValid: [],
    inTeam: []
  };

  // auth username valid
  for await (const username of usernames) {
    const user = await authUserExist({ username });
    if (!user || username === 'root') {
      userMap.inValid.push({
        username,
        userId: ''
      });
      continue;
    }

    const tmb = await authUserExistTeam({ userId: user._id, teamId });
    if (tmb) {
      userMap.inTeam.push({
        username,
        userId: user._id
      });
      continue;
    }

    // invite
    userMap.invite.push({
      username,
      userId: user._id
    });
  }

  await checkTeamMaxMembersPermission(teamId, userMap.invite.length);

  if (userMap.invite.length > 0) {
    await mongoSessionRun(async (session) => {
      // insert teamMember and send inform
      const tmbIdList: string[] = [];
      for await (const user of userMap.invite) {
        // Exists member will be updated
        const tmb = await MongoTeamMember.findOneAndUpdate(
          {
            userId: user.userId,
            teamId
          },
          {
            name: user.username.slice(0, 10),
            status: TeamMemberStatusEnum.waiting
          },
          {
            session,
            upsert: true
          }
        );
        if (tmb) {
          tmbIdList.push(tmb._id);
        }
      }
    });
  }

  return userMap;
}

export default NextAPI(handler);
