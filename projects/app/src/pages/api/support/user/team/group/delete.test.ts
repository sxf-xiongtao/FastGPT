// import '../../../../__mocks__/base';
// import { getTestRequest } from '@/test/utils';
// import handler from './delete';
// import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
// import { root } from '@/pages/api/__mocks__/db/init';
// import { RequestResponse } from '@/pages/api/__mocks__/type';
// import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
// import { getTeamDefaultGroup } from '@fastgpt/service/support/permission/memberGroup/controllers';
// import { getNanoid } from '@fastgpt/global/common/string/tools';
// import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
//
// test('200', async () => {
//   const testGroup = await MongoMemberGroupModel.create({
//     teamId: root.teamId,
//     name: 'test'
//   });
//   const res = (await handler(
//     ...getTestRequest({
//       query: {
//         groupId: String(testGroup._id)
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(200);
//
//   const group = await MongoMemberGroupModel.findOne({ name: 'test' });
//   expect(group).toBeNull();
// });
//
// test('group not exist', async () => {
//   const res = (await handler(
//     ...getTestRequest({
//       query: {
//         groupId: getNanoid()
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(TeamErrEnum.groupNotExist);
// });
//
// test('groupId is empty', async () => {
//   const res = (await handler(
//     ...getTestRequest({
//       query: {
//         groupId: ''
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(CommonErrEnum.missingParams);
// });
//
// test('groupId is default group id', async () => {
//   const group = await getTeamDefaultGroup({
//     teamId: root.teamId
//   });
//
//   const res = (await handler(
//     ...getTestRequest({
//       query: {
//         groupId: String(group._id)
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(TeamErrEnum.cannotDeleteDefaultGroup);
// });
