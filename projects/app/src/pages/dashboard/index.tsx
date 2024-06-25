import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Box, Center, Divider, GridItem, HStack, Spinner, VStack } from '@chakra-ui/react';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Icons from '@/components/Icons';
import { GET } from '@/service/common/request';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import BoxCard from '@/components/common/BoxContainer/Card';

type fetchChatData = {
  count: number;
  total?: number;
  date: string;
  increase?: number;
  increaseRate?: string;
};

type chatDataType = {
  date: string;
  userCount: number;
  userIncrease?: number;
  userIncreaseRate?: string;
  payCount: number;
  chatCount: number;
  chatIncrease?: number;
};

type TNumbers = {
  appsCount: number;
  datasetsCount: number;
  usersCount: number;
};

export default function DashBoard() {
  const [chartData, setChartData] = useState<chatDataType[]>([]);
  const [numbers, setNumbers] = useState<TNumbers>();

  useEffect(() => {
    const fetchChartData = async () => {
      const [userResponse, payResponse, chatResponse]: fetchChatData[][] = await Promise.all([
        GET(`admin/routes/dashboard/getUserFormData`, {}).then((res: any) => res.countResult),
        GET(`admin/routes/dashboard/getPaysFormData`, {}).then((res: any) => res.countResult),
        GET(`admin/routes/dashboard/getChatFormData`, {}).then((res: any) => res.countResult)
      ]);

      const data = userResponse.map((item, i) => {
        const pay = payResponse.find((payItem) => payItem.date === item.date);
        const chat = chatResponse.find((chatItem) => chatItem.date === item.date);

        return {
          date: dayjs(item.date).format('MM/DD'),
          userCount: item.count,
          userIncrease: item.increase,
          userIncreaseRate: item.increaseRate,
          payCount: pay ? pay.count / PRICE_SCALE : 0,
          chatCount: chat ? chat.count : 0
        };
      });
      setChartData(data);
    };

    const fetchNumbers = async () => {
      const res: TNumbers = await GET(`/admin/routes/dashboard/getNumbers`);
      setNumbers(res);
    };

    fetchChartData();
    fetchNumbers();
  }, []);

  return (
    <BoxCard>
      <Box>
        <Box className="w-full text-[20px] font-normal text-[#405169] mb-2">信息总览</Box>
        <Divider />
        <HStack gap={6} className="w-full my-4">
          <GridItem flex={1} className="border-r">
            <DataItem
              icon={<Icons type="user" />}
              title={'用户'}
              count={numbers?.usersCount || 0}
            />
          </GridItem>
          <GridItem flex={1} className="border-r">
            <DataItem
              icon={<Icons type="dataset" />}
              title={'知识库'}
              count={numbers?.datasetsCount || 0}
            />
          </GridItem>
          <GridItem flex={1}>
            <DataItem icon={<Icons type="app" />} title={'应用'} count={numbers?.appsCount || 0} />
          </GridItem>
        </HStack>
        <Divider />
      </Box>

      <Box
        className="bg-white my-2 w-full px-6 py-8"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        <span className="w-full text-[20px] font-normal text-[#405169] mb-2">趋势图</span>
        <UserChart data={chartData} />
      </Box>
    </BoxCard>
  );
}

const DataItem = React.memo((props: { icon: React.ReactElement; title: string; count: number }) => {
  return (
    <Box className="flex">
      <div className="w-12 h-12 flex justify-center items-center border rounded-full mr-2">
        {props.icon}
      </div>
      <div className="text-[#4E5969]">
        <div className="font-bold text-lg">{props.title}</div>
        <div className="text-lg">{props.count}</div>
      </div>
    </Box>
  );
});

DataItem.displayName = 'DataItem';

const CustomTooltip = ({ active, payload }: any) => {
  const data = payload?.[0]?.payload as chatDataType;
  if (active && data) {
    return (
      <div
        style={{
          background: 'white',
          padding: '5px 8px',
          borderRadius: '8px',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        <p className="label">
          日期: <strong>{data.date}</strong>
        </p>
        <p className="label">
          用户总数: <strong>{data.userCount}</strong>
        </p>
        <p className="label">
          今日用户增长数量: <strong>{data.userIncrease}</strong>
        </p>
        <p className="label">
          今日对话数量: <strong>{data.chatCount}</strong>
        </p>
        <p className="label">
          今日支付: <strong>{data.payCount}</strong>元
        </p>
      </div>
    );
  }
  return null;
};

const UserChart = ({ data }: { data: chatDataType[] }) => {
  return (
    <ResponsiveContainer width="100%" height={360} className="mt-4">
      <AreaChart
        width={730}
        height={250}
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="userCount"
          stroke="#40C6FF"
          strokeWidth={1.5}
          fill="#F0F4FF"
        />
        <Area
          type="monotone"
          dataKey="payCount"
          stroke="#E2A5FF"
          strokeWidth={1.5}
          fill="#FAF1FF"
        />
        <Area
          type="monotone"
          dataKey="chatCount"
          stroke="#72E4D6"
          strokeWidth={1.5}
          fill="#EAFEFB"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
