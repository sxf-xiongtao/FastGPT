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
  ModalBody
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import MyModal from '@/components/common/MyModal';
import { getDatasets } from '@/web/admin/datasets/api';

const DatasetTable = () => {
  const [appDetail, setAppDetail] = useState();
  const elementRef = useRef<HTMLDivElement>(null);

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

  return (
    <Box className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full pl-12 pb-4 pt-6 h-full flex flex-col"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
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
                  </Tr>
                </Thead>
                <Tbody fontSize={'sm'}>
                  {datasets.map((item, i) => (
                    <Tr key={i}>
                      <Td>{i + 1}</Td>
                      <Td>{item.name}</Td>
                      <Td>{item.username}</Td>
                      <Td>{item.intro}</Td>
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

          {!!appDetail && (
            <AppDetailModal app={appDetail} onClose={() => setAppDetail(undefined)} />
          )}
        </Box>
      </Box>
    </Box>
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
