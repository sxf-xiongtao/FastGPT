'use client';
import React, { useState } from 'react';
import {
  Button,
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
  ModalBody
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { getApps } from '@/web/admin/apps/api';
import MyModal from '@fastgpt/web/components/common/MyModal';
import BoxCard from '@/components/common/BoxContainer/Card';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { type InferGetServerSidePropsType } from 'next';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';

const AppTable = ({ FE_URL }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [appDetail, setAppDetail] = useState<any>();

  const {
    data: apps,
    isLoading,
    ScrollData
  } = useScrollPagination(getApps, {
    pageSize: 20
  });

  const routeToApp = (id: string) => {
    window.open(FE_URL + '/app/detail?appId=' + id, '_blank');
  };

  return (
    <BoxCard display={'flex'} flexDirection={'column'} h={'100%'}>
      <HStack pb={4}>
        <Box className="text-2xl font-bold text-[#405169]">应用列表</Box>
        <Box className="flex-grow"></Box>
      </HStack>
      <ScrollData position={'relative'} h={'100%'}>
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>应用名</Th>
                <Th>创建者</Th>
                <Th>介绍</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody fontSize={'sm'}>
              {apps.map((item, i) => (
                <Tr key={i}>
                  <Td>{i + 1}</Td>
                  <Td>{item.name}</Td>
                  <Td>{item.username}</Td>
                  <Td>{item.intro}</Td>
                  <Td textAlign={'center'}>
                    <HStack spacing={2} ml={4}>
                      <Button variant={'whiteBase'} size={'sm'} onClick={() => setAppDetail(item)}>
                        详情
                      </Button>
                      <Button variant={'whiteBase'} size={'sm'} onClick={() => routeToApp(item.id)}>
                        跳转
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {!isLoading && apps.length === 0 && (
            <Flex
              mt={'20vh'}
              flexDirection={'column'}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
              <Box mt={2} color={'myGray.500'}>
                无应用记录～
              </Box>
            </Flex>
          )}
        </TableContainer>
      </ScrollData>

      {!!appDetail && <AppDetailModal app={appDetail} onClose={() => setAppDetail(undefined)} />}
    </BoxCard>
  );
};

export default AppTable;

function AppDetailModal({ app, onClose }: { app: any; onClose: () => void }) {
  return (
    <MyModal
      isOpen={true}
      onClose={onClose}
      iconSrc="/imgs/modal/bill.svg"
      title={'应用详情'}
      maxW={['90vw', '700px']}
    >
      <ModalBody>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>应用id:</Box>
          <Box>{app.id}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>应用名:</Box>
          <Box>{app.name}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>介绍:</Box>
          <Box>{app.intro}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>创建者:</Box>
          <Box>{app.username}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>创建者 ID:</Box>
          <Box>{app.userId}</Box>
        </Flex>
      </ModalBody>
    </MyModal>
  );
}

export async function getServerSideProps(content: any) {
  const FE_URL = process.env.FE_DOMAIN || null;
  return {
    props: {
      ...(await serviceSideProps(content)),
      FE_URL
    }
  };
}
