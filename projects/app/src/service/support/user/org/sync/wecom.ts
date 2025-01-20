import axios from 'axios';
import { syncUser, syncOrg } from '../../controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { wecomUserPrefix } from '@/global/support/user/constants';

export type WecomSyncOrgParams = {
  corpid: string;
  agentid: string;
  secret: string;
  syncSecret: string;
  teamId: string;
};

type Department = {
  id: string;
  name: string;
  name_en: string;
  parentid: string;
  order: number;
  department_leader: Array<string>;
};

const getDepartmentListURL = 'https://qyapi.weixin.qq.com/cgi-bin/department/list';
const getUserIdListURL = 'https://qyapi.weixin.qq.com/cgi-bin/user/list_id';
const getAccessTokenURL = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken';

async function getAccessToken({ corpid, secret }: { corpid: string; secret: string }) {
  const { data } = await axios.request<{ errcode: number; errmsg: string; access_token: string }>({
    url: getAccessTokenURL,
    method: 'POST',
    data: {
      corpid,
      corpsecret: secret
    }
  });
  if (!data.access_token) {
    return Promise.reject(data.errmsg);
  }
  return data.access_token;
}

async function getDepartmentList({ corpid, secret }: { corpid: string; secret: string }) {
  const { data } = await axios.request<{
    errmsg: string;
    department: Department[];
    errcode: number;
  }>({
    url: getDepartmentListURL,
    method: 'POST',
    params: {
      access_token: await getAccessToken({
        corpid,
        secret
      })
    }
  });
  if (!data.department || data.errcode !== 0) {
    return Promise.reject(data.errmsg);
  }
  return data.department;
}

async function getUserIdList({
  corpid,
  syncSecret,
  access_token: passedToken
}: {
  corpid: string;
  syncSecret: string;
  access_token?: string;
}) {
  const access_token = passedToken || (await getAccessToken({ corpid, secret: syncSecret }));

  const { data } = await axios.request<{
    errmsg: string;
    errcode: number;
    next_cursor: string;
    dept_user: Array<{
      userid: string;
      department: string;
    }>;
  }>({
    url: getUserIdListURL,
    method: 'POST',
    params: {
      access_token: access_token
    }
  });
  if (!data.dept_user || data.errcode !== 0) {
    return Promise.reject(data.errmsg);
  }
  if (data.next_cursor) {
    const nextUserIdList = await getUserIdList({ corpid, syncSecret, access_token });
    data.dept_user.push(...nextUserIdList);
  }
  return data.dept_user;
}

/** Sync the org and user from wecom
 * @param teamId. The Team will be overwitten to the org and user.
 * @param corpid. The corpid of wecom.
 * @param secret. 一个应用的 Secret
 * @param syncSecret. [通讯录同步助手Secret]
 * */
export async function wecomOrgSync({ teamId, corpid, secret, syncSecret }: WecomSyncOrgParams) {
  const departmentList = await getDepartmentList({ corpid, secret });
  const userIdList = await getUserIdList({ corpid, syncSecret });
  /** Map userId to departments */
  const userMap = new Map<string, string[]>();
  for (const user of userIdList) {
    const department = user.department;
    if (!userMap.has(user.userid)) {
      userMap.set(user.userid, []);
    }
    userMap.get(user.userid)!.push(department);
  }

  if (userIdList.length === 0) return Promise.reject('获取用户列表异常');

  await mongoSessionRun(async (session) => {
    // sync user
    await syncUser({
      teamId,
      source: 'wecom',
      latestUserList: Array.from(userMap.keys()).map((userid) => ({
        userid,
        name: userid
      })),
      session
    });

    // sync org
    /** construct a map
     * Map<departmentId, department>
     * departmentId: string 1,2,3,... (root is 1) this should be *pathid*
     * department: Department {id, name, parentid}
     */
    const departmentMap = (() => {
      const map = new Map<string, Department>();
      departmentList.forEach((department) => {
        map.set(department.id, department);
      });
      return map;
    })();

    /** get the path of department
     *  @param id: string 1,2,3,... (derpartmentid from wecom)
     *  path and pathid pattern law:
     *  | org     | pathid | path  |
     *  |---------|--------|-------|
     *  | root    | 1      | ""    |
     *  | dept1   | 2      | /1/2  |
     */
    const getPath = (id: string) => {
      const arr = [id];
      while (String(arr[arr.length - 1]) !== '1') {
        const department = departmentMap.get(arr[arr.length - 1]);
        if (!department) {
          return '';
        }
        arr.push(department.parentid);
      }
      arr.reverse();
      arr.pop();
      return arr.length === 0 ? '' : '/' + arr.join('/');
    };

    const tmbs = await (async () => {
      const users = await MongoUser.find(
        {
          teamId,
          username: { $in: userIdList.map((user) => `${wecomUserPrefix}-${user.userid}`) }
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

      return users.map((user) => {
        const tmb = tmbs.find((tmb) => String(tmb.userId) === String(user._id));
        return {
          userid: String(user._id),
          wecomUserId: user.username.split('-')[1],
          tmbId: String(tmb!._id),
          department: userMap.get(user.username.split('-')[1])!
        };
      });
    })();

    await syncOrg({
      teamId,
      latestOrgList: departmentList.map((department) => {
        return {
          pathId: department.id,
          path: getPath(department.id),
          name: department.name,
          tmbIds: (() => {
            const ts = tmbs.filter((tmb) =>
              Array.isArray(tmb.department)
                ? tmb.department.includes(department.id)
                : tmb.department === department.id
            );
            return ts.map((t) => t.tmbId);
          })()
        };
      }),
      session
    });
  });
}
