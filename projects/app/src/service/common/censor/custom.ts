import axios from 'axios';

export const censorCheckCustom = async (text: string) => {
  const customURL = global.systemConfig.censor?.customCensorURL;

  const result = await axios.request<{
    success: boolean;
    message: string;
  }>({
    url: customURL,
    method: 'POST',
    data: {
      text
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (result.data.success) {
    return {
      code: 200
    };
  } else {
    return {
      code: 5000,
      message: result.data.message
    };
  }
};
