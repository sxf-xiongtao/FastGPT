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
import DetailTeamModal from './components/DetailTeamModal';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/usage/tools';
import EditTeamModal from './components/EditTeamModal';
import { getTeams } from '@/web/admin/users/api';
import BoxCard from '@/components/common/BoxContainer/Card';
import { serviceSideProps } from '@/web/common/i18n';

const TeamTable = () => {
  const [search, setSearch] = useState<string>();
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const {
    data: teams,
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
    refreshDeps: [search]
  });

  return (
    <BoxCard display={'flex'} flexDirection={'column'} h={'100%'}>
      <HStack px={!isMobile ? 8 : 0} pb={!isMobile ? 0 : 4}>
        {!isMobile && <Box className="text-2xl font-bold text-[#405169]">团队列表</Box>}
        <Box className="flex-grow"></Box>
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
                <Th>#</Th>
                <Th>团队id</Th>
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
                  <Td>{item.id}</Td>
                  <Td>{item.name}</Td>
                  <Td>{item.ownerName}</Td>
                  <Td>{formatStorePrice2Read(item.balance, 100000)}元</Td>
                  <Td>
                    {item.createTime ? dayjs(item.createTime).format('YYYY/MM/DD HH:mm:ss') : '-'}
                  </Td>
                  <Td>
                    <Box className="space-x-2">
                      <DetailTeamModal teamId={item.id} />
                      <EditTeamModal
                        data={item}
                        updateData={() => {
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
    </BoxCard>
  );
};

export default TeamTable;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
