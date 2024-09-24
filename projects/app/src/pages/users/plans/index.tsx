import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Box,
  HStack,
  InputGroup,
  Input,
  InputLeftElement,
  useMediaQuery
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import { getPlans } from '@/web/admin/users/api';
import { standardSubLevelMap } from '../pays';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import PlanAddModal from './components/PlanAddModal';
import PlanEditModal from './components/PlanEditModal';
import BoxCard from '@/components/common/BoxContainer/Card';
import { serviceSideProps } from '@/web/common/i18n';

export type PlanType = {
  teamId: string;
  teamName: string;
  userName: string;
  type: `${SubTypeEnum}`;
  level: `${StandardSubLevelEnum}`;
  createTime: string;
  expiredTime: string;
  startTime: string;
  totalPoints: number;
  surplusPoints: number;
  extraDatasetSize: number;
};

const PlanTable = () => {
  const [search, setSearch] = useState<string>();
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const {
    data: plans,
    isLoading,
    ScrollData,
    getData
  } = usePagination({
    api: getPlans,
    pageSize: 20,
    params: {
      search
    },
    type: 'scroll',
    refreshDeps: [search]
  });

  return (
    <BoxCard display={'flex'} flexDirection={'column'} h={'100%'}>
      <HStack px={!isMobile ? 8 : 0} pb={!isMobile ? 0 : 4}>
        {!isMobile && <Box className="text-2xl font-bold text-[#405169]">套餐管理</Box>}
        <Box className="flex-grow"></Box>
        <PlanAddModal
          updateData={() => {
            getData(1);
          }}
        />
        <InputGroup w={'350px'}>
          <InputLeftElement h={'full'}>
            <MyIcon name="common/searchLight" w={4} color={'myGray.400'} />
          </InputLeftElement>
          <Input
            placeholder="请输入用户名搜索"
            size={'sm'}
            onChange={(e) => setSearch(e.target.value)}
          ></Input>
        </InputGroup>
      </HStack>

      <ScrollData position={'relative'} h={'100%'} py={[0, 5]} px={[3, 8]}>
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>团队id</Th>
                <Th>团队名</Th>
                <Th>用户名</Th>
                <Th>订阅套餐</Th>
                <Th>积分</Th>
                <Th>起止时间</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody fontSize={'sm'}>
              {plans.map((item, i) => (
                <Tr key={i}>
                  <Td>{item.teamId}</Td>
                  <Td>{item.teamName}</Td>
                  <Td>{item.userName}</Td>
                  <Td>
                    {item.type === SubTypeEnum.standard
                      ? `${standardSubLevelMap[item.level]?.label}版`
                      : item.type === SubTypeEnum.extraDatasetSize
                        ? '额外知识库'
                        : 'AI 积分套餐'}
                  </Td>
                  <Td>
                    {item.totalPoints
                      ? `${Math.round(item.totalPoints - item.surplusPoints)} / ${item.totalPoints}`
                      : '-'}
                  </Td>
                  <Td>
                    <Box>
                      {item.startTime ? dayjs(item.startTime).format('YYYY/MM/DD HH:mm:ss') : '-'}
                    </Box>
                    <Box>
                      {item.expiredTime
                        ? dayjs(item.expiredTime).format('YYYY/MM/DD HH:mm:ss')
                        : '-'}
                    </Box>
                  </Td>
                  <Td>
                    <PlanEditModal
                      data={item}
                      subType={item.type}
                      getData={() => {
                        getData(1);
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {!isLoading && plans.length === 0 && (
            <Flex
              mt={'20vh'}
              flexDirection={'column'}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
              <Box mt={2} color={'myGray.500'}>
                无套餐记录～
              </Box>
            </Flex>
          )}
        </TableContainer>
      </ScrollData>
    </BoxCard>
  );
};

export default PlanTable;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
