import { test_getUserInfo, test_redirectFn } from './test';
import { leapmotor_getUserInfo, leapmotor_redirectFn } from './leapmotor';
import { aecc_callbackFn, aecc_getUserInfo, aecc_redirectFn } from './aecc';
import { hebamr_redirectFn, hebamr_getUserInfo } from './hebamr';
import {
  feishu_redirectFn,
  feishu_getUserInfo,
  feishu_getOrgList,
  feishu_getUserList
} from './feishu';
import { wecom_redirectFn, wecom_getUserInfo, wecom_getUserList, wecom_getOrgList } from './wecom';
import { dingtalk_redirectFn, dingtalk_getUserInfo } from './dingtalk';
import type {
  AssertFn,
  CallbackFn,
  GetMetaDataFn,
  GetOrgListFn,
  GetUserInfoFn,
  GetUserListFn,
  RedirectFn
} from 'type';
import {
  testSaml_assertFn,
  testSaml_getMetadata,
  testSaml_getUserInfo,
  testSaml_redirectFn
} from 'provider/testSaml';
import { bjsf_assertFn, bjsf_getMetadata, bjsf_getUserInfo, bjsf_redirectFn } from 'provider/bjsf';
import { TCL_getUserInfo, tcl_redirectFn } from 'provider/tcl';
import { oauth2_getUserInfo, oauth2_redirectFn } from './oauth2';

const providerMap: {
  [key: string]: {
    getUserInfo: GetUserInfoFn;
    redirectFn: RedirectFn;
    callbackFn?: CallbackFn;
    getMetaData?: GetMetaDataFn;
    assertFn?: AssertFn;
    getUserList?: GetUserListFn;
    getOrgList?: GetOrgListFn;
  };
} = {
  test: {
    redirectFn: test_redirectFn,
    getUserInfo: test_getUserInfo
  },
  testSaml: {
    redirectFn: testSaml_redirectFn,
    getUserInfo: testSaml_getUserInfo,
    getMetaData: testSaml_getMetadata,
    assertFn: testSaml_assertFn
  },
  leapmotor: {
    redirectFn: leapmotor_redirectFn,
    getUserInfo: leapmotor_getUserInfo
  },
  aecc: {
    redirectFn: aecc_redirectFn,
    callbackFn: aecc_callbackFn,
    getUserInfo: aecc_getUserInfo
  },
  hebamr: {
    redirectFn: hebamr_redirectFn,
    getUserInfo: hebamr_getUserInfo
  },
  bjsf: {
    redirectFn: bjsf_redirectFn,
    getUserInfo: bjsf_getUserInfo,
    getMetaData: bjsf_getMetadata,
    assertFn: bjsf_assertFn
  },
  tcl: {
    redirectFn: tcl_redirectFn,
    getUserInfo: TCL_getUserInfo
  },
  feishu: {
    redirectFn: feishu_redirectFn,
    getUserInfo: feishu_getUserInfo,
    getUserList: feishu_getUserList,
    getOrgList: feishu_getOrgList
  },
  wecom: {
    redirectFn: wecom_redirectFn,
    getUserInfo: wecom_getUserInfo,
    getUserList: wecom_getUserList,
    getOrgList: wecom_getOrgList
  },
  dingtalk: {
    redirectFn: dingtalk_redirectFn,
    getUserInfo: dingtalk_getUserInfo
  },
  oauth2: {
    redirectFn: oauth2_redirectFn,
    getUserInfo: oauth2_getUserInfo
  }
};

export function getProvider() {
  const provider = process.env.SSO_PROVIDER as keyof typeof providerMap;
  if (!providerMap[provider]) {
    return false;
  }
  return providerMap[provider];
}
