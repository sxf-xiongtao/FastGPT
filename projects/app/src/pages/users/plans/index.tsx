import React, { useState, useEffect, useRef } from 'react';
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
import { StandardSubLevelEnum } from '@fastgpt/global/support/wallet/sub/constants';

type PlanType = {
  teamName: string;
  userName: string;
  planLevel: `${StandardSubLevelEnum}`;
  createTime: string;
  expiredTime: string;
  startTime: string;
  totalPoints: number;
  surplusPoints: number;
};

const PlanTable = () => {
  const [search, setSearch] = useState<string>();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const {
    data: plans,
    setData: setPlans,
    isLoading,
    ScrollData,
    getData
  } = usePagination<PlanType>({
    api: getPlans,
    pageSize: 20,
    params: {
      search
    },
    type: 'scroll',
    defaultRequest: false,
    elementRef
  });

  useEffect(() => {
    getData(1);
  }, [getData]);

  return (
    <Box className="pt-3 h-full flex flex-col">
      <HStack px={!isMobile ? 8 : 0} pb={!isMobile ? 0 : 4}>
        {!isMobile && <Box className="text-2xl font-bold text-[#405169]">套餐管理</Box>}
        <Box className="flex-grow"></Box>
        <InputGroup w={'350px'}>
          <InputLeftElement h={'full'}>
            <MyIcon name="common/searchLight" w={4} color={'myGray.400'} />
          </InputLeftElement>
          <Input
            placeholder="请输入用户名，回车搜索"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPlans([]);
                getData(1);
              }
            }}
            size={'sm'}
            onChange={(e) => setSearch(e.target.value)}
          ></Input>
        </InputGroup>
      </HStack>
      <Box
        position={'relative'}
        h={'100%'}
        overflow={'overlay'}
        ref={elementRef}
        py={[0, 5]}
        px={[3, 8]}
      >
        <ScrollData>
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>团队名</Th>
                  <Th>用户名</Th>
                  <Th>订阅套餐</Th>
                  <Th>积分</Th>
                  <Th>开始时间</Th>
                  <Th>结束时间</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody fontSize={'sm'}>
                {plans.map((item, i) => (
                  <Tr key={i}>
                    <Td>{i + 1}</Td>
                    <Td>{item.teamName}</Td>
                    <Td>{item.userName}</Td>
                    <Td>{standardSubLevelMap[item.planLevel]?.label}</Td>
                    <Td>
                      {item.totalPoints
                        ? `${Math.round(item.totalPoints - item.surplusPoints)} / ${item.totalPoints}`
                        : '-'}
                    </Td>
                    <Td>
                      {item.startTime ? dayjs(item.startTime).format('YYYY/MM/DD HH:mm:ss') : '-'}
                    </Td>
                    <Td>
                      {item.expiredTime
                        ? dayjs(item.expiredTime).format('YYYY/MM/DD HH:mm:ss')
                        : '-'}
                    </Td>
                    <Td>
                      <Box className="space-x-2"></Box>
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
                  无团队记录～
                </Box>
              </Flex>
            )}
          </TableContainer>
        </ScrollData>
      </Box>
    </Box>
  );
};

export default PlanTable;
