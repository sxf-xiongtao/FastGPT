import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authUserExistTeam } from '@/service/support/user/team/controller';
import type {
  InviteMemberProps,
  InviteMemberResponse
} from '@fastgpt/global/support/user/team/controller.d';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { authUserExist } from '@fastgpt/service/support/user/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { checkTeamMaxMembersPermission } from '@/service/support/permission/teamLimit';
import { PermissionList } from '@fastgpt/service/support/permission/resourcePermission/permisson';
import { authMemberPermission } from '@/service/support/user/team/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { usernames, role } = req.body as InviteMemberProps;
    const { teamId, tmbId } = await authCert({ req, authToken: true });

    // is manager
    await authMemberPermission({ tmbId, permission: PermissionList['Manage'] });

    let userMap: InviteMemberResponse = {
      invite: [],
      inValid: [],
      inTeam: []
    };

    const leaveMembers: {
      username: string;
      userId: string;
    }[] = [];

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

      // auth user leave
      const leaveTmb = await MongoTeamMember.findOne({
        userId: user._id,
        teamId,
        status: TeamMemberStatusEnum.leave
      });
      if (leaveTmb) {
        leaveTmb.status = TeamMemberStatusEnum.waiting;
        leaveTmb.role = role;
        await leaveTmb.save();
        leaveMembers.push({
          username,
          userId: user._id
        });
        continue;
      }

      userMap.invite.push({
        username,
        userId: user._id
      });
    }

    // insert teamMember and send inform
    if (userMap.invite.length > 0) {
      await checkTeamMaxMembersPermission(teamId, userMap.invite.length);

      await MongoTeamMember.insertMany(
        userMap.invite.map((user) => {
          return {
            userId: user.userId,
            teamId,
            name: user.username.slice(0, 5),
            role: role,
            status: TeamMemberStatusEnum.waiting
          };
        })
      );
    }

    userMap.invite = userMap.invite.concat(leaveMembers);

    jsonRes(res, {
      data: userMap
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
