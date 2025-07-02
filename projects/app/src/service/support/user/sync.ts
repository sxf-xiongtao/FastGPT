import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import axios from 'axios';
import { syncOrg, syncUser } from './controller';
import { getTeamByUsername } from './team/controller';

export async function syncUserAndOrg() {
  const url = process.env.EXTERNAL_USER_SYSTEM_BASE_URL;
  const token = process.env.EXTERNAL_USER_SYSTEM_AUTH_TOKEN;

  const teamId = (await getTeamByUsername('root'))._id;
  const userListRes = (
    await axios.get<{
      success: boolean;
      message?: string;
      userList: {
        username: string;
        memberName: string;
        avatar?: string;
        contact?: string;
        orgs?: string[];
      }[];
    }>(`${url}/user/list`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  ).data;
  if (!userListRes.success) {
    return Promise.reject(userListRes.message);
  }
  const orgListRes = (
    await axios.get<{
      success: boolean;
      message?: string;
      orgList: {
        id: string;
        name: string;
        parentId: string;
      }[];
    }>(`${url}/org/list`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  ).data;

  if (!orgListRes.success) {
    return Promise.reject(orgListRes.message);
  }

  const latestUserList = userListRes.userList;

  if (latestUserList.length === 0) return; // do nothing
  addLog.info(`syncUserAndOrg: sync user`);
  await mongoSessionRun(async (session) =>
    syncUser({
      teamId,
      latestUserList,
      session
    })
  );
  addLog.info(`syncUserAndOrg: sync org`);
  await mongoSessionRun(async (session) => {
    if (orgListRes.orgList.length === 0) return; // do not sync org
    const OrgMap = (() => {
      const map = new Map<
        string,
        {
          id: string;
          name: string;
          parentId: string;
        }
      >();
      orgListRes.orgList.forEach((department) => {
        map.set(department.id, department);
      });
      return map;
    })();
    const RootOrg = orgListRes.orgList.find((i) => i.parentId === '');

    const getPath = (id: string) => {
      const arr = [id];
      if (id === RootOrg?.id) {
        // root node
        return '';
      }
      while (arr[arr.length - 1] !== RootOrg?.id) {
        // '' --> root node
        const org = OrgMap.get(arr[arr.length - 1]);
        if (!org) {
          return '';
        }
        arr.push(org.parentId);
      }
      arr.reverse();
      arr.pop();
      return arr.length === 0 ? '' : '/' + arr.join('/');
    };

    const tmbs = await (async () => {
      const userMap = new Map<string, string[]>();
      for (const user of userListRes.userList) {
        userMap.set(user.username, user.orgs || []);
      }

      const users = await MongoUser.find(
        {
          username: { $in: userListRes.userList.map((user) => user.username) }
        },
        undefined,
        { session }
      ).lean();

      const tmbs = await MongoTeamMember.find(
        {
          teamId,
          userId: { $in: users.map((user) => user._id) }
        },
        undefined,
        { session }
      ).lean();
      const userIdTmbMap = new Map<string, TeamMemberSchema>();
      tmbs.forEach((tmb) => {
        userIdTmbMap.set(String(tmb.userId), tmb);
      });

      return users.map((user) => {
        const tmb = userIdTmbMap.get(String(user._id))!;
        return {
          userid: String(user._id),
          tmbId: String(tmb._id),
          department: userMap.get(user.username)!
        };
      });
    })();
    const latestOrgList = orgListRes.orgList.map((org) => ({
      pathId: org.id,
      path: getPath(org.id),
      name: org.name,
      tmbIds: (() => {
        const ts = tmbs.filter((tmb) =>
          Array.isArray(tmb.department)
            ? tmb.department.includes(org.id)
            : tmb.department === org.id
        );
        return ts.map((t) => t.tmbId);
      })()
    }));
    await syncOrg({
      teamId,
      latestOrgList,
      session
    });
  });

  addLog.info(`syncUserAndOrg: end`);
}
