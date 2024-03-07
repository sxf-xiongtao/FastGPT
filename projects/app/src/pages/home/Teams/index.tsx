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
  InputLeftElement
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import DetailTeamModal from './components/DetailTeamModal';
import { getTeams } from '@/web/admin/teams/api';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/usage/tools';
import EditTeamModal from './components/EditTeamModal';

const TeamTable = () => {
  const [search, setSearch] = useState<string>();
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    data: teams,
    setData: setTeams,
    isLoading,
    ScrollData,
    getData
  } = usePagination({
    api: getTeams,
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
    <Box className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full pl-12 pb-4 pt-6 h-full flex flex-col"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        <HStack px={8}>
          <Box className="text-2xl font-bold text-[#405169]">团队列表</Box>
          <Box className="flex-grow"></Box>
          <InputGroup w={240}>
            <InputLeftElement h={'full'}>
              <MyIcon name="common/searchLight" w={4} color={'myGray.400'} />
            </InputLeftElement>
            <Input
              placeholder="请输入团队名或用户名，回车搜索"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTeams([]);
                  getData(1);
                }
              }}
              onChange={(e) => setSearch(e.target.value)}
              h={8}
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
                    <Th>余额</Th>
                    <Th>创建时间</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody fontSize={'sm'}>
                  {teams.map((item, i) => (
                    <Tr key={i}>
                      <Td>{i + 1}</Td>
                      <Td>{item.name}</Td>
                      <Td>{item.ownerName}</Td>
                      <Td>{formatStorePrice2Read(item.balance, 100000)}元</Td>
                      <Td>
                        {item.createTime
                          ? dayjs(item.createTime).format('YYYY/MM/DD HH:mm:ss')
                          : '-'}
                      </Td>
                      <Td>
                        <Box className="space-x-2">
                          <DetailTeamModal teamId={item.id} />
                          <EditTeamModal
                            data={item}
                            updateData={() => {
                              setTeams([]);
                              getData(1);
                            }}
                          />
                        </Box>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {!isLoading && teams.length === 0 && (
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
    </Box>
  );
};

export default TeamTable;
