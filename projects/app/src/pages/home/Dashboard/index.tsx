import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Box, Divider, GridItem, HStack, VStack } from '@chakra-ui/react';

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
  payTotal: number;
  payCount: number;
};

type TNumbers = {
  appsCount: number;
  datasetsCount: number;
  usersCount: number;
};

const PRICE_SCALE = 100000;

export default function DashBoard() {
  const [chartData, setChartData] = useState<chatDataType[]>([]);
  const [numbers, setNumbers] = useState<TNumbers>();

  useEffect(() => {
    const fetchChartData = async () => {
      const [userResponse, payResponse]: fetchChatData[][] = await Promise.all([
        GET(`admin/routes/dashboard/getUserFormData`, {}).then((res: any) => res.countResult),
        GET(`admin/routes/dashboard/getPaysFormData`, {}).then((res: any) => res.countResult)
      ]);
      const data = userResponse.map((item, i) => {
        const pay = payResponse.find((pay) => item.date === pay.date);
        return {
          date: dayjs(item.date).format('MM/DD'),
          userCount: item.count,
          userIncrease: item.increase,
          userIncreaseRate: item.increaseRate,
          payCount: pay ? pay.count / PRICE_SCALE : 0,
          payTotal: pay?.total ? pay.total / PRICE_SCALE : 0
        };
      });
      setChartData(data);
    };

    const fetchNumbers = async () => {
      const res: any = await GET(`/admin/routes/dashboard/getNumbers`);
      setNumbers(res);
    };

    fetchChartData();
    fetchNumbers();
  }, []);

  return (
    <div className="w-[90%] m-auto">
      <VStack className="w-full">
        <Box
          className="bg-white mt-8 w-full px-6 py-8"
          style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
        >
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
              <DataItem
                icon={<Icons type="app" />}
                title={'应用'}
                count={numbers?.appsCount || 0}
              />
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
      </VStack>
    </div>
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
          用户今日增长数量: <strong>{data.userIncrease}</strong>
        </p>
        <p className="label">
          今日支付: <strong>{data.payCount}</strong>元
        </p>
        <p className="label">
          60天累计支付: <strong>{data.payTotal}</strong>元
        </p>
      </div>
    );
  }
  return null;
};

const UserChart = ({ data }: { data: chatDataType[] }) => {
  return (
    <ResponsiveContainer width="100%" height={320} className="mt-4">
      <AreaChart
        width={730}
        height={250}
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="userCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="payTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="userCount"
          stroke="#82ca9d"
          fillOpacity={1}
          fill="url(#userCount)"
        />
        <Area
          type="monotone"
          dataKey="payTotal"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#payTotal)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
