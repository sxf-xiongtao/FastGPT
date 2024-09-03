import { ApiRequestProps } from '@fastgpt/service/type/next';
import axios from 'axios';

const AUTH_URL = process.env.LEAPMOTOR_AUTH_URL as string;
const GET_USER_INFO_URL = process.env.LEAPMOTOR_GET_USER_INFO_URL as string;
const CLIENT_ID = process.env.LEAPMOTOR_CLIENT_ID as string;
const CLIENT_SECRET = process.env.LEAPMOTOR_CLIENT_SECRET as string;
const REDIRECT_URI = process.env.LEAPMOTOR_REDIRECT_URI as string;

export const LeapMotorSSOHandler = async (req: ApiRequestProps) => {
  const { code } = req.query;

  const { data } = await axios.request({
    url: AUTH_URL,
    method: 'get',
    params: {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    }
  });
  const access_token = data.access_token;
  const { data: userInfo } = await axios.request({
    url: GET_USER_INFO_URL,
    method: 'get',
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  return {
    username: userInfo.data.id + '-LeapMotor',
    email: userInfo.data.email
  };
};
