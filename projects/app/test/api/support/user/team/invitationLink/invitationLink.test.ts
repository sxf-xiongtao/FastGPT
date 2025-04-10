import createHandler, {
  type CreateInvitationLinkBody,
  type CreateInvitationLinkQuery,
  type CreateInvitationLinkResponse
} from '@/pages/api/support/user/team/invitationLink/create';

import listHandler, {
  type InvitationLinkListBody,
  InvitationLinkListQuery,
  InvitationLinkListResponse
} from '@/pages/api/support/user/team/invitationLink/list';

import acceptHandler, {
  type InvitationLinkAcceptBody,
  type InvitationLinkAcceptQuery,
  type InvitationLinkAcceptResponse
} from '@/pages/api/support/user/team/invitationLink/accept';

import forbidHandler, {
  type ForbidLinkBody,
  type ForbidLinkQuery,
  type ForbidLinkResponse
} from '@/pages/api/support/user/team/invitationLink/forbid';

import infoHandler, {
  type InvitationLinkInfoBody,
  type InvitationLinkInfoQuery,
  type InvitationLinkInfoResponse
} from '@/pages/api/support/user/team/invitationLink/info';

import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { getRootUser, getUser } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('invitationLink test', () => {
  it('create invitation link', async () => {
    const root = await getRootUser();
    const res = await Call<
      CreateInvitationLinkBody,
      CreateInvitationLinkQuery,
      CreateInvitationLinkResponse
    >(createHandler, {
      auth: root,
      body: {
        usedTimesLimit: 1,
        description: 'test',
        expires: '7d'
      }
    });
    expect(res.code).toBe(200);
    expect(res.data).toBeTypeOf('string');
    const res2 = await Call<
      CreateInvitationLinkBody,
      CreateInvitationLinkQuery,
      CreateInvitationLinkResponse
    >(createHandler, {
      auth: root,
      body: {
        usedTimesLimit: 1,
        description: 'test2',
        expires: '30m'
      }
    });
    expect(res2.code).toBe(200);
    expect(res2.data).toBeTypeOf('string');

    const res3 = await Call<
      CreateInvitationLinkBody,
      CreateInvitationLinkQuery,
      CreateInvitationLinkResponse
    >(createHandler, {
      auth: root,
      body: {
        usedTimesLimit: 1,
        description: 'test',
        expires: '1y'
      }
    });
    expect(res3.code).toBe(200);
    expect(res3.data).toBeTypeOf('string');
  });
  it('create 10 invitation link and list it, then create another invitation link causing error', async () => {
    const root = await getRootUser();
    // create 10 invitation link
    for (const i of Array(10).keys()) {
      await Call<CreateInvitationLinkBody, CreateInvitationLinkQuery, CreateInvitationLinkResponse>(
        createHandler,
        {
          auth: root,
          body: {
            usedTimesLimit: 1,
            description: 'test' + i,
            expires: '7d'
          }
        }
      );
    }

    //list invitation link
    const listRes = await Call<
      InvitationLinkListBody,
      InvitationLinkListQuery,
      InvitationLinkListResponse
    >(listHandler, {
      auth: root
    });

    expect(listRes.code).toBe(200);
    expect(listRes.data.length).toBe(10);
    expect(listRes.data[0].description).toBe('test9');
    expect(listRes.data[9].description).toBe('test0');

    const res = await Call<
      CreateInvitationLinkBody,
      CreateInvitationLinkQuery,
      CreateInvitationLinkResponse
    >(createHandler, {
      auth: root,
      body: {
        usedTimesLimit: 1,
        description: 'test',
        expires: '7d'
      }
    });
    expect(res.code).toBe(500);
    expect(res.error).toBe(TeamErrEnum.tooManyInvitations);
  });

  it('create one invitation link and accept it', async () => {
    const root = await getRootUser();
    const res = await Call<
      CreateInvitationLinkBody,
      CreateInvitationLinkQuery,
      CreateInvitationLinkResponse
    >(createHandler, {
      auth: root,
      body: {
        usedTimesLimit: 1,
        description: 'test',
        expires: '7d'
      }
    });
    expect(res.code).toBe(200);
    expect(res.data).toBeTypeOf('string');

    // get info of it
    const infoRes = await Call<
      InvitationLinkInfoBody,
      InvitationLinkInfoQuery,
      InvitationLinkInfoResponse
    >(infoHandler, {
      auth: root,
      query: {
        linkId: res.data
      }
    });
    expect(infoRes.code).toBe(200);
    expect(infoRes.data.members.length).toBe(0);
    expect(infoRes.data.forbidden).toBeFalsy();
    expect(infoRes.data.expires);

    // accept it
    const user = await getUser('test');
    const acceptRes = await Call<
      InvitationLinkAcceptBody,
      InvitationLinkAcceptQuery,
      InvitationLinkAcceptResponse
    >(acceptHandler, {
      auth: user,
      body: {
        linkId: res.data
      }
    });
    expect(acceptRes.code).toBe(200);

    // get info of it
    const infoRes2 = await Call<
      InvitationLinkInfoBody,
      InvitationLinkInfoQuery,
      InvitationLinkInfoResponse
    >(infoHandler, {
      auth: root,
      query: {
        linkId: res.data
      }
    });
    expect(infoRes2.code).toBe(200);
    expect(infoRes2.data.members.length).toBe(1);

    // accept it again
    const userTest2 = await getUser('test2');
    const acceptRes2 = await Call<
      InvitationLinkAcceptBody,
      InvitationLinkAcceptQuery,
      InvitationLinkAcceptResponse
    >(acceptHandler, {
      auth: userTest2,
      body: {
        linkId: res.data
      }
    });
    expect(acceptRes2.code).toBe(500);
    expect(acceptRes2.error).toBe(TeamErrEnum.invitationLinkInvalid);
  });

  it('create one invitation link and then forbid it, then accept it', async () => {
    const root = await getRootUser();
    const res = await Call<
      CreateInvitationLinkBody,
      CreateInvitationLinkQuery,
      CreateInvitationLinkResponse
    >(createHandler, {
      auth: root,
      body: {
        usedTimesLimit: -1,
        description: 'test',
        expires: '7d'
      }
    });
    expect(res.code).toBe(200);
    expect(res.data).toBeTypeOf('string');

    // get info of it
    const infoRes = await Call<
      InvitationLinkInfoBody,
      InvitationLinkInfoQuery,
      InvitationLinkInfoResponse
    >(infoHandler, {
      auth: root,
      query: {
        linkId: res.data
      }
    });
    expect(infoRes.code).toBe(200);
    expect(infoRes.data.members.length).toBe(0);
    expect(infoRes.data.forbidden).toBeFalsy();
    expect(infoRes.data.expires);

    // forbid it
    const user = await getUser('test');
    const forbidRes = await Call<ForbidLinkBody, ForbidLinkQuery, ForbidLinkResponse>(
      forbidHandler,
      {
        auth: root,
        body: {
          linkId: res.data
        }
      }
    );
    expect(forbidRes.code).toBe(200);

    // get info of it
    const infoRes2 = await Call<
      InvitationLinkInfoBody,
      InvitationLinkInfoQuery,
      InvitationLinkInfoResponse
    >(infoHandler, {
      auth: root,
      query: {
        linkId: res.data
      }
    });
    expect(infoRes2.code).toBe(200);
    expect(infoRes2.data.members.length).toBe(0);
    expect(infoRes2.data.forbidden).toBeTruthy();

    // accept it
    const userTest2 = await getUser('test2');
    const acceptRes2 = await Call<
      InvitationLinkAcceptBody,
      InvitationLinkAcceptQuery,
      InvitationLinkAcceptResponse
    >(acceptHandler, {
      auth: userTest2,
      body: {
        linkId: res.data
      }
    });
    expect(acceptRes2.code).toBe(500);
    expect(acceptRes2.error).toBe(TeamErrEnum.invitationLinkInvalid);
  });
});
