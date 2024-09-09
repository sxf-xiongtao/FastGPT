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
  ModalBody,
  Button
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { getDatasets } from '@/web/admin/datasets/api';
import BoxCard from '@/components/common/BoxContainer/Card';
import { serviceSideProps } from '@/web/common/i18n';
import { useRouter } from 'next/router';
import { type InferGetServerSidePropsType } from 'next';

const DatasetTable = ({ FE_URL }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [appDetail, setAppDetail] = useState();
  const elementRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    data: datasets,
    isLoading,
    ScrollData,
    getData
  } = usePagination({
    api: getDatasets,
    pageSize: 20,
    type: 'scroll',
    defaultRequest: false
  });

  useEffect(() => {
    getData(1);
  }, [getData]);

  const routeToDataset = (id: string) => {
    window.open(FE_URL + '/dataset/detail?datasetId=' + id, '_blank');
  };

  return (
    <BoxCard display={'flex'} flexDirection={'column'} h={'100%'}>
      <HStack px={8}>
        <Box className="text-2xl font-bold text-[#405169]">知识库列表</Box>
        <Box className="flex-grow"></Box>
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
                  <Th>知识库名</Th>
                  <Th>创建者</Th>
                  <Th>介绍</Th>
                  <Th>数据量</Th>
                  <Th>向量总数</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody fontSize={'sm'}>
                {datasets.map((item, i) => (
                  <Tr key={i}>
                    <Td>{i + 1}</Td>
                    <Td>{item.name}</Td>
                    <Td
                      cursor={'pointer'}
                      onClick={() => {
                        router.push(`/users/users?username=${item.username}`);
                      }}
                    >
                      {item.username}
                    </Td>
                    <Td>{item.intro}</Td>
                    <Td>{item.totalDatas}</Td>
                    <Td>{item.totalVectors}</Td>
                    <Td>
                      <HStack>
                        <Button
                          variant={'whiteBase'}
                          size={'sm'}
                          onClick={() => routeToDataset(item.id)}
                        >
                          跳转
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {!isLoading && datasets.length === 0 && (
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
      </Box>
    </BoxCard>
  );
};

export default DatasetTable;

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
          <Box flex={'0 0 120px'}>收藏数:</Box>
          <Box>{app['share.collection']}</Box>
        </Flex>
      </ModalBody>
    </MyModal>
  );
}

export async function getServerSideProps(content: any) {
  const FE_URL = process.env.FE_URL;
  return {
    props: {
      ...(await serviceSideProps(content)),
      FE_URL
    }
  };
}
