// import '../../../../__mocks__/base';
// import { getTestRequest } from '@/test/utils';
// import handler from './create';
// import { root } from '@/pages/api/__mocks__/db/init';
// import { RequestResponse } from '@/pages/api/__mocks__/type';
// import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
// import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
// import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
//
// test('200', async () => {
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         name: 'aaa'
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(200);
//
//   const group = await MongoMemberGroupModel.findOne({ name: 'aaa' });
//   expect(group).toBeDefined();
//   expect(group?.name).toBe('aaa');
// });
//
// test('name is duplicate', async () => {
//   await MongoMemberGroupModel.create({
//     teamId: root.teamId,
//     name: 'test'
//   });
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         name: 'test'
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(TeamErrEnum.groupNameDuplicate);
// });
//
// test('Name is default group name', async () => {
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         name: DefaultGroupName
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(TeamErrEnum.groupNameDuplicate);
// });
//
// test('name is empty', async () => {
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         name: ''
//       },
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(TeamErrEnum.groupNameEmpty);
// });
