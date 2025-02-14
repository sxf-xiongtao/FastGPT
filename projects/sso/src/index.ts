import express from 'express';
import { getErrText } from './utils';

import { test_getUserInfo, test_redirectFn } from './provider/test';
import { leapmotor_getUserInfo, leapmotor_redirectFn } from './provider/leapmotor';
import { aecc_callbackFn, aecc_getUserInfo, aecc_redirectFn } from './provider/aecc';
import { hebamr_redirectFn, hebamr_getUserInfo } from 'provider/hebamr';
import { initGlobalStore } from 'global';
import { AssertFn, CallbackFn, GetMetaDataFn, GetUserInfoFn, RedirectFn } from 'type';
import {
  initTestSaml,
  testSaml_assertFn,
  testSaml_getMetadata,
  testSaml_getUserInfo,
  testSaml_redirectFn
} from 'provider/testSaml';
import {
  init_bjsf,
  bjsf_assertFn,
  bjsf_getMetadata,
  bjsf_getUserInfo,
  bjsf_redirectFn
} from 'provider/bjsf';

const providerMap: {
  [key: string]: {
    getUserInfo: GetUserInfoFn;
    redirectFn: RedirectFn;
    callbackFn?: CallbackFn;
    getMetaData?: GetMetaDataFn;
    assertFn?: AssertFn;
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
  }
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3030;

function getProvider() {
  const provider = process.env.SSO_PROVIDER as keyof typeof providerMap;
  if (!providerMap[provider]) {
    return false;
  }
  return providerMap[provider];
}

// 接收重定向请求
app.get('/login/oauth/authorize', async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { redirectFn } = provider;

  if (process.env.REDIRECT) {
    // if current hostname is not equal to HOSTNAME, redirect to HOSTNAME with the same path
    if (process.env.HOSTNAME) {
      const hostname = new URL(process.env.HOSTNAME).hostname;
      if (req.hostname !== hostname) {
        const redirectUrl = new URL(req.originalUrl, process.env.HOSTNAME);
        res.redirect(redirectUrl.toString());
        return;
      }
    }
  }

  const { redirect_uri, state } = req.query as {
    redirect_uri: string;
    state: string;
  };

  if (!redirect_uri) {
    return res.status(400).json({ error: 'redirect_uri is required' });
  }

  try {
    const { redirectUrl } = await redirectFn({ req, redirect_uri, state });

    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      message: getErrText(error)
    });
  }
});

app.get('/login/saml/metadata.xml', async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { getMetaData } = provider;

  if (!getMetaData) {
    return res.status(400).json({ error: 'getMetaData is required' });
  }

  try {
    const metadata = await getMetaData();
    res.set('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (error) {
    res.status(500).json({
      message: getErrText(error)
    });
  }
});

// 用作处理特殊的重定向请求
app.get('/login/oauth/callback', async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { callbackFn } = provider;

  if (!callbackFn) {
    return res.status(400).json({ error: 'callbackFn is required' });
  }

  try {
    const { redirectUrl } = await callbackFn({ req });
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      message: getErrText(error)
    });
  }
});

app.post('/login/saml/assert', async (req, res) => {
  const { SAMLResponse, RelayState } = req.body as {
    SAMLResponse: string;
    RelayState: string;
  };
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { assertFn } = provider;
  if (!assertFn) {
    return res.status(400).json({ error: 'assertFn is required' });
  }
  if (!SAMLResponse) {
    return res.status(400).json({ error: 'SAMLResponse and RelayState is required' });
  }

  try {
    const { redirectUrl } = await assertFn({ SAMLResponse, RelayState });
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      message: getErrText(error)
    });
  }
});

// 获取用户身份信息
app.get('/login/oauth/access_token', async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { getUserInfo } = provider;

  try {
    const { code } = req.query as { code: string };

    if (!code) {
      throw new Error('code is required');
    }

    const userInfo = await getUserInfo(code);

    // 返回用户信息
    res.json({
      success: true,
      message: '',
      ...userInfo
    });
  } catch (error: any) {
    res.json({
      success: false,
      message: getErrText(error)
    });
  }
});

app.listen(PORT, () => {
  const provider = process.env.SSO_PROVIDER;
  console.log('Provider', provider);

  console.log(`SSO server is running on http://localhost:${PORT}`);
  initGlobalStore();
  if (provider === 'testSaml') {
    initTestSaml();
  } else if (provider === 'bjsf') {
    init_bjsf();
  }
});
