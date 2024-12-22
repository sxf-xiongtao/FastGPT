import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Box, Flex, Grid, GridItem, HStack } from '@chakra-ui/react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { GET } from '@/service/common/request';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import BoxCard from '@/components/common/BoxContainer/Card';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import type { IconNameType } from '@fastgpt/web/components/common/Icon/type';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';

type FetchChatData = {
  date: string;
  count: number;
  total?: number;
  increase?: number;
  increaseRate?: string;
};

type chatDataType = {
  date: string;
  userCount: number;
  userIncrease?: number;
  payCount: number;
  chatCount: number;
  totalPoints: number;
};

type TNumbers = {
  appsCount: number;
  datasetsCount: number;
  usersCount: number;
};

const DataItem = ({
  icon,
  title,
  count = 0,
  bg
}: {
  icon: IconNameType;
  title: string;
  count?: number;
  bg: string;
}) => {
  return (
    <HStack bg={bg} px={8} py={3} borderRadius={'lg'} spacing={5}>
      <MyIcon name={icon} w={'2rem'} h={'2rem'} />
      <Box>
        <Box>{title}</Box>
        <Box fontSize={'xl'} fontWeight={'bold'}>
          {count}
        </Box>
      </Box>
    </HStack>
  );
};

export default function DashBoard() {
  const { data: datas, loading: isLoadingGetNumbers } = useRequest2(
    () => GET<TNumbers>(`/admin/routes/dashboard/getNumbers`),
    {
      manual: false
    }
  );

  const [dateRange, setDateRange] = useState<string>('7');
  const { data: chartData = [], loading: isLoadingChart } = useRequest2(
    async () => {
      const [userResponse, payResponse, chatResponse, pointResponse] = await Promise.all([
        GET<FetchChatData[]>(`admin/routes/dashboard/getUserFormData`, {
          day: dateRange
        }),
        GET<FetchChatData[]>(`admin/routes/dashboard/getPaysFormData`, { day: dateRange }),
        GET<FetchChatData[]>(`admin/routes/dashboard/getChatFormData`, {
          day: dateRange
        }),
        GET<FetchChatData[]>(`admin/routes/dashboard/getPointUsages`, { day: dateRange })
      ]);

      const data = userResponse.map((item, i) => {
        const pay = payResponse.find((payItem) => payItem.date === item.date);
        const chat = chatResponse.find((chatItem) => chatItem.date === item.date);
        const point = pointResponse.find((pointItem) => pointItem.date === item.date);

        return {
          date: dayjs(item.date).format('MM/DD'),
          userCount: item.count,
          userIncrease: item.increase,
          payCount: pay ? pay.count / PRICE_SCALE : 0,
          chatCount: chat ? chat.count : 0,
          totalPoints: point ? +point.count.toFixed(2) : 0
        };
      });
      return data;
    },
    {
      manual: false,
      refreshDeps: [dateRange]
    }
  );

  const isLoading = isLoadingGetNumbers || isLoadingChart;

  return (
    <BoxCard isLoading={isLoading}>
      {/* Header time range select */}
      <Flex justify={'space-between'}>
        <Box fontSize={'lg'} fontWeight={'bold'}>
          统计数据
        </Box>
      </Flex>
      {/* Data card */}
      <Grid mt={2} templateColumns={['1fr', 'repeat(3, 1fr)']} gap={6}>
        <GridItem flex={1}>
          <DataItem
            icon={'support/user/userLight'}
            title={'用户总数'}
            count={datas?.usersCount}
            bg={'#EDFAFF'}
          />
        </GridItem>
        <GridItem flex={1}>
          <DataItem
            icon={'core/dataset/datasetLight'}
            title={'知识库总数'}
            count={datas?.datasetsCount}
            bg={'#F0EEFF'}
          />
        </GridItem>
        <GridItem flex={1}>
          <DataItem
            icon={'core/app/aiLight'}
            title={'应用总数'}
            count={datas?.appsCount}
            bg={'#F0F4FF'}
          />
        </GridItem>
      </Grid>

      {/* charts */}
      <Box mt={5}>
        <Flex mb={4} justify={'space-between'}>
          <Box fontSize={'lg'} fontWeight={'bold'}>
            趋势图
          </Box>
          <Box>
            <FillRowTabs
              list={[
                { label: '近7天', value: '7' },
                { label: '近30天', value: '30' },
                { label: '近90天', value: '90' }
              ]}
              value={dateRange}
              onChange={setDateRange}
            />
          </Box>
        </Flex>
        <UserChart data={chartData} />
      </Box>
    </BoxCard>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  const data = payload?.[0]?.payload as chatDataType;
  if (active && data) {
    return (
      <Box bg={'white'} p={3} borderRadius={'md'} boxShadow={'base'}>
        <Box fontWeight={'bold'} color={'black'}>
          {data.date}
        </Box>
        <HStack>
          <Box>用户总数:</Box>
          <Box fontWeight={'bold'}>{data.userCount}</Box>
        </HStack>
        <HStack>
          <Box>今日用户增长数量:</Box>
          <Box fontWeight={'bold'}>{data.userIncrease}</Box>
        </HStack>
        <HStack>
          <Box>今日对话数量:</Box>
          <Box fontWeight={'bold'}>{data.chatCount}</Box>
        </HStack>
        <HStack>
          <Box>今日积分消耗:</Box>
          <Box fontWeight={'bold'}>{data.totalPoints}</Box>
        </HStack>
        <HStack>
          <Box>今日支付:</Box>
          <Box fontWeight={'bold'}>{data.payCount}元</Box>
        </HStack>
      </Box>
    );
  }
  return null;
};

const UserChart = ({ data }: { data: chatDataType[] }) => {
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const list = [
    { name: '用户总数', dataKey: 'userCount', stroke: '#11B6FC' },
    { name: '支付数量', dataKey: 'payCount', stroke: '#E2A5FF' },
    { name: '对话数量', dataKey: 'chatCount', stroke: '#13C4B9' },
    { name: '积分消耗', dataKey: 'totalPoints', stroke: '#FDB022' }
  ];
  return (
    <ResponsiveContainer width="100%" height={360} className="mt-4">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          onClick={(e) => {
            setHiddenLines((prev) => ({
              ...prev,
              // @ts-ignore
              [e.dataKey]: !prev[e.dataKey]
            }));
          }}
        />
        {list.map((item) => (
          <Line
            key={item.dataKey}
            type="monotone"
            name={item.name}
            dataKey={item.dataKey}
            stroke={item.stroke}
            strokeWidth={1.5}
            dot={false}
            hide={hiddenLines[item.dataKey]}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
