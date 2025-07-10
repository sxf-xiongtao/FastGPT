import axios from 'axios';

interface BingConversionConfig {
  customerId: string;
  customerAccountId: string;
  developerToken: string;
  endpoint: string;
}

const config: BingConversionConfig = {
  customerId: process.env.BING_ADS_CUSTOMER_ID || '',
  customerAccountId: process.env.BING_ADS_CUSTOMER_ACCOUNT_ID || '',
  developerToken: process.env.BING_ADS_DEVELOPER_TOKEN || '',
  endpoint:
    process.env.BING_API_ENVIRONMENT === 'PRODUCTION'
      ? 'https://campaign.api.bingads.microsoft.com/CampaignManagement/v13/OfflineConversions/Apply'
      : 'https://campaign.api.sandbox.bingads.microsoft.com/CampaignManagement/v13/OfflineConversions/Apply'
};

const refreshAccessToken = async () => {
  const clientId = process.env.BING_OAUTH_CLIENT_ID;
  const clientSecret = process.env.BING_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.BING_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Bing OAuth配置不完整');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const response = await axios.post(
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return {
    access_token: response.data.access_token
  };
};

export const trackBingConversion = async (msclkid: string) => {
  if (!msclkid || !config.developerToken) return;

  try {
    const tokenData = await refreshAccessToken();
    const accessToken = tokenData.access_token;

    const postData = {
      OfflineConversions: [
        {
          ConversionName: process.env.BING_ADS_CONVERSION_Name || 'Registration',
          ConversionTime: new Date().toISOString(),
          MicrosoftClickId: msclkid
        }
      ]
    };

    const response = await axios.post(config.endpoint, postData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        DeveloperToken: config.developerToken,
        CustomerId: config.customerId,
        CustomerAccountId: config.customerAccountId
      }
    });

    console.log('Bing转化追踪成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('Bing转化追踪异常:', error);
  }
};
