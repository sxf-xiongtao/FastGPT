import { ApiRequestProps } from '@fastgpt/service/type/next';
import axios from 'axios';

export const TestSSOHandler = async (req: ApiRequestProps) => {
  console.debug('Debug SSO Handler', req.query, req.body);

  const { data } = await axios.request({
    url: 'https://jz8eg83ofo.bja.sealos.run/getUserInfo',
    method: 'get',
    params: {
      token: req.query.token
    }
  });

  console.debug('get user info', data);
  return {
    username: data.user,
    email: data.email
  };
};

// Laf test script
// 1. sso
// import cloud from '@lafjs/cloud'
// export default async function (ctx: FunctionContext) {
//   console.log(ctx.query);
//   const token = 'thisIsATestToken';
//   return {
//     token,
//     query: ctx.query,
//     url: ctx.query.url+'?token='+token,
//   }
// }
//
// 2. get user info
// import cloud from '@lafjs/cloud'
//
// export default async function (ctx: FunctionContext) {
//   console.log('get user info')
//   const token = ctx.query.token;
//   if (token === 'thisIsATestToken') {
//     return {
//       user: 'test 3rd party',
//       email: 'test@example.com'
//     }
//   } else {
//     return {}
//   }
// }
//
