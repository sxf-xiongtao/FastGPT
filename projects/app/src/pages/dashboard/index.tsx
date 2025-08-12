'use client';
import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Box, Flex, Grid, GridItem, HStack, useTheme } from '@chakra-ui/react';
import { GET, POST } from '@/service/common/request';
import BoxCard from '@/components/common/BoxContainer/Card';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { serviceSideProps } from '@/web/common/i18n/utils';
import LineChartComponent from '@fastgpt/web/components/common/charts/LineChartComponent';
import { getInitFormData } from '@/web/core/config/api';
import type { GetUserFormDataResponse } from '@/pages/api/admin/routes/dashboard/getUserFormData';
import MyBox from '@fastgpt/web/components/common/MyBox';
import type { GetPaysFormDataResponse } from '../api/admin/routes/dashboard/getPaysFormData';
import type { GetChatFormDataResponse } from '../api/admin/routes/dashboard/getChatFormData';
import type { GetCostChartsResponse } from '../api/admin/routes/dashboard/getCostFormData';
import AreaChartComponent from '@fastgpt/web/components/common/charts/AreaChartComponent';

// Type definitions
type ViewMode = 'traffic' | 'active' | 'payment' | 'cost';
type DateRange = 7 | 30 | 90 | 180;

type DataItemProps = {
  icon: string;
  title: string;
  count?: number;
  bg: string;
};
const DataItem = ({ icon, title, count = 0, bg }: DataItemProps) => {
  return (
    <HStack bg={bg} px={8} py={3} borderRadius={'lg'} spacing={5}>
      <MyIcon name={icon as any} w={'2rem'} h={'2rem'} />
      <Box>
        <Box>{title}</Box>
        <Box fontSize={'xl'} fontWeight={'bold'}>
          {count}
        </Box>
      </Box>
    </HStack>
  );
};

const ChartsBoxStyles = {
  px: 5,
  pt: 4,
  pb: 10,
  h: '400px',
  border: 'base',
  borderRadius: 'md',
  overflow: 'hidden'
};
const ChartsContainer = ({
  dateRange,
  viewMode,
  isSubscriptionEnabled
}: {
  isSubscriptionEnabled: boolean;
  dateRange: DateRange;
  viewMode: ViewMode;
}) => {
  const theme = useTheme();

  const startTime = dayjs().subtract(dateRange, 'day').add(1, 'day').startOf('day').format();

  // Date mapping helper function
  const formatList2ChartsData = <T extends { date: string }>(
    sourceData: T[],
    defaultValues: Record<string, number>
  ): T[] => {
    const formatResponse = sourceData.map((item) => ({
      ...item,
      date: dayjs(item.date).format('MM/DD')
    }));

    // Create complete date list
    const diff = dayjs().diff(dayjs(startTime).startOf('day'), 'day') + 1;
    const completeDateList = Array.from({ length: diff }, (_, i) =>
      dayjs(startTime).add(i, 'day').format('MM/DD')
    );

    return completeDateList.map((date) => {
      const existingData = formatResponse.find((item) => item.date === date);
      return {
        ...(existingData || { date, ...defaultValues }),
        date,
        x: date,
        xLabel: date
      };
    }) as unknown as T[];
  };

  const { data: trafficData, loading: isLoadingTraffic } = useRequest2(
    async () => {
      if (viewMode !== 'traffic') return;

      return await GET<GetUserFormDataResponse>(`/admin/routes/dashboard/getUserFormData`, {
        startTime
      }).then((res) => {
        return {
          startUserCount: res.startUserCount,
          registeredUserCount: formatList2ChartsData(res.registeredUserCount, {
            count: 0
          })
        };
      });
    },
    {
      manual: false,
      refreshDeps: [dateRange, viewMode]
    }
  );
  const { data: paysData, loading: isLoadingPays } = useRequest2(
    async () => {
      if (viewMode !== 'payment') return;
      return await GET<GetPaysFormDataResponse>(`/admin/routes/dashboard/getPaysFormData`, {
        startTime
      }).then((res) => ({
        orderAmounts: formatList2ChartsData(res.orderAmounts, {
          totalCount: 0,
          successCount: 0
        }),
        payAmounts: formatList2ChartsData(res.payAmounts, {
          totalCount: 0
        }),
        payTeams: formatList2ChartsData(res.payTeams, {
          totalCount: 0
        })
      }));
    },
    {
      manual: false,
      refreshDeps: [dateRange, viewMode]
    }
  );
  const { data: activeData, loading: isLoadingActive } = useRequest2(
    async () => {
      if (viewMode !== 'active') return;
      return await GET<GetChatFormDataResponse>(
        `/admin/routes/dashboard/getChatFormData`,
        {
          startTime
        },
        { timeout: 600000 }
      ).then((res) => ({
        chatAmounts: formatList2ChartsData(res.chatAmounts, {
          totalCount: 0
        }),
        chatItemAmounts: formatList2ChartsData(res.chatItemAmounts, {
          totalCount: 0
        })
      }));
    },
    {
      manual: false,
      refreshDeps: [dateRange, viewMode]
    }
  );
  const { data: costData, loading: isLoadingCost } = useRequest2(
    async () => {
      if (viewMode !== 'cost') return;
      return await POST<GetCostChartsResponse>(`/admin/routes/dashboard/getCostFormData`, {
        startTime
      }).then((res) => ({
        pointUsages: formatList2ChartsData(res.pointUsages, {
          totalCount: 0
        })
      }));
    },
    {
      manual: false,
      refreshDeps: [dateRange, viewMode]
    }
  );

  const [orderAmountType, setOrderAmountType] = useState<'all' | 'success'>('success');
  const orderAmountField = orderAmountType === 'all' ? 'totalCount' : 'successCount';

  const isLoading = isLoadingTraffic || isLoadingPays || isLoadingActive || isLoadingCost;

  return (
    <MyBox minH={'400px'} isLoading={isLoading}>
      {trafficData && (
        <>
          <Box {...ChartsBoxStyles}>
            <AreaChartComponent
              data={trafficData.registeredUserCount}
              startDateValue={trafficData.startUserCount}
              title={'总用户数'}
              enableIncremental={false}
              defaultDisplayMode="cumulative"
              lines={[
                {
                  dataKey: 'count',
                  name: '总用户数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                { label: '总用户数', dataKey: 'count', color: theme.colors.blue['500'] }
              ]}
            />
          </Box>
          <Box {...ChartsBoxStyles} mt={4}>
            <AreaChartComponent
              data={trafficData.registeredUserCount}
              title={'注册用户数'}
              lines={[
                {
                  dataKey: 'count',
                  name: '注册用户数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                {
                  label: '注册用户数',
                  dataKey: 'count',
                  color: theme.colors.adora['500']
                }
              ]}
            />
          </Box>
        </>
      )}
      {paysData && isSubscriptionEnabled && (
        <>
          <Box {...ChartsBoxStyles}>
            <AreaChartComponent
              data={paysData.payAmounts}
              title={'付费金额'}
              lines={[
                {
                  dataKey: 'totalCount',
                  name: '付费金额',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                {
                  label: '付费金额',
                  dataKey: 'totalCount',
                  color: theme.colors.adora['500']
                }
              ]}
            />
          </Box>
          <Box {...ChartsBoxStyles} mt={4}>
            <AreaChartComponent
              data={paysData.orderAmounts}
              title={'订单数'}
              HeaderLeftChildren={
                <FillRowTabs<'all' | 'success'>
                  list={[
                    { label: '全部', value: 'all' },
                    { label: '成功', value: 'success' }
                  ]}
                  py={0.5}
                  px={2}
                  value={orderAmountType}
                  onChange={(val) => setOrderAmountType(val)}
                />
              }
              lines={[
                {
                  dataKey: orderAmountField,
                  name: '订单数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                { label: '订单数', dataKey: orderAmountField, color: theme.colors.blue['500'] }
              ]}
            />
          </Box>
          <Box {...ChartsBoxStyles} mt={4}>
            <AreaChartComponent
              data={paysData.payTeams}
              title={'付费团队数'}
              lines={[
                {
                  dataKey: 'totalCount',
                  name: '付费团队数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                { label: '付费团队数', dataKey: 'totalCount', color: theme.colors.blue['500'] }
              ]}
            />
          </Box>
        </>
      )}
      {activeData && (
        <>
          <Box {...ChartsBoxStyles}>
            <AreaChartComponent
              data={activeData.chatItemAmounts}
              title={'总对话数'}
              lines={[
                {
                  dataKey: 'totalCount',
                  name: '总对话数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                {
                  label: '总对话数',
                  dataKey: 'totalCount',
                  color: theme.colors.adora['500']
                }
              ]}
            />
          </Box>
          <Box {...ChartsBoxStyles} mt={4}>
            <AreaChartComponent
              data={activeData.chatAmounts}
              title={'总会话数'}
              lines={[
                {
                  dataKey: 'totalCount',
                  name: '总会话数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                { label: '总会话数', dataKey: 'totalCount', color: theme.colors.blue['500'] }
              ]}
            />
          </Box>
          <Box {...ChartsBoxStyles} mt={4}>
            <AreaChartComponent
              data={activeData.chatItemAmounts}
              title={'每个会话平均对话数'}
              lines={[
                {
                  dataKey: 'averageCount',
                  name: '每个会话平均对话数',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                {
                  label: '每个会话平均对话数',
                  dataKey: 'averageCount',
                  color: theme.colors.blue['500']
                }
              ]}
            />
          </Box>
        </>
      )}
      {costData && (
        <>
          <Box {...ChartsBoxStyles}>
            <AreaChartComponent
              data={costData.pointUsages}
              title={'积分消耗'}
              lines={[
                {
                  dataKey: 'totalCount',
                  name: '积分消耗',
                  color: theme.colors.blue['500']
                }
              ]}
              tooltipItems={[
                { label: '积分消耗', dataKey: 'totalCount', color: theme.colors.blue['500'] }
              ]}
            />
          </Box>
        </>
      )}
    </MyBox>
  );
};

export default function DashBoard(): JSX.Element {
  const { data: systemConfig } = useRequest2(getInitFormData, {
    manual: false
  });
  // Check if subscription is enabled
  const isSubscriptionEnabled = useMemo((): boolean => {
    if (!systemConfig) return false;

    const feConfigs = systemConfig.fastgpt?.feConfigs;
    const subPlans = systemConfig.fastgpt?.subPlans;

    return Boolean(
      feConfigs?.show_pay && subPlans?.standard && Object.keys(subPlans.standard).length > 0
    );
  }, [systemConfig]);

  const [dateRange, setDateRange] = useState<DateRange>(7);
  const [viewMode, setViewMode] = useState<ViewMode>('traffic');

  const { data: datas, loading: isLoadingGetNumbers } = useRequest2(
    () =>
      GET<{ appsCount: number; datasetsCount: number; usersCount: number }>(
        `/admin/routes/dashboard/getNumbers`
      ),
    {
      manual: false
    }
  );
  const dataItems = [
    { icon: 'support/user/userLight', title: '用户总数', count: datas?.usersCount, bg: '#EDFAFF' },
    {
      icon: 'core/dataset/datasetLight',
      title: '知识库总数',
      count: datas?.datasetsCount,
      bg: '#F0EEFF'
    },
    { icon: 'core/app/aiLight', title: '应用总数', count: datas?.appsCount, bg: '#F0F4FF' }
  ];

  const isLoading = isLoadingGetNumbers;

  return (
    <BoxCard isLoading={isLoading}>
      <>
        <Flex justify={'space-between'}>
          <Box fontSize={'lg'} fontWeight={'bold'}>
            统计数据
          </Box>
        </Flex>
        <Grid mt={2} templateColumns={['1fr', 'repeat(3, 1fr)']} gap={6}>
          {dataItems.map((item, index) => (
            <GridItem flex={1} key={index}>
              <DataItem {...item} />
            </GridItem>
          ))}
        </Grid>
      </>

      <Box mt={5}>
        <Flex mb={4} justify={'space-between'}>
          <FillRowTabs<ViewMode>
            list={[
              {
                label: '流量',
                value: 'traffic'
              },
              ...(isSubscriptionEnabled
                ? [
                    {
                      label: '付费',
                      value: 'payment' as const
                    }
                  ]
                : []),
              {
                label: '活跃',
                value: 'active'
              },
              {
                label: '成本',
                value: 'cost'
              }
            ]}
            py={1.5}
            value={viewMode}
            onChange={(val) => setViewMode(val)}
          />
          <Box display={'flex'} alignItems={'center'}>
            <FillRowTabs<DateRange>
              list={[
                { label: '近7天', value: 7 },
                { label: '近30天', value: 30 },
                { label: '近90天', value: 90 },
                { label: '近180天', value: 180 }
              ]}
              py={0.5}
              px={2}
              value={dateRange}
              onChange={(val: DateRange) => setDateRange(val)}
            />
          </Box>
        </Flex>
        <ChartsContainer
          dateRange={dateRange}
          viewMode={viewMode}
          isSubscriptionEnabled={isSubscriptionEnabled}
        />
      </Box>
    </BoxCard>
  );
}

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
