import React, { useState, useEffect, useRef } from 'react';
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
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import { getApps } from '@/web/admin/apps/api';
import MyModal from '@fastgpt/web/components/common/MyModal';
import BoxCard from '@/components/common/BoxContainer/Card';
import { serviceSideProps } from '@/web/common/i18n';

const AppTable = () => {
  const [appDetail, setAppDetail] = useState();
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    data: apps,
    isLoading,
    ScrollData,
    getData
  } = usePagination({
    api: getApps,
    pageSize: 20,
    type: 'scroll',
    defaultRequest: false,
    elementRef
  });

  useEffect(() => {
    getData(1);
  }, [getData]);

  return (
    <BoxCard display={'flex'} flexDirection={'column'} h={'100%'}>
      <HStack px={8}>
        <Box className="text-2xl font-bold text-[#405169]">应用列表</Box>
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
                  <Th>应用名</Th>
                  <Th>收藏数</Th>
                  <Th>介绍</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody fontSize={'sm'}>
                {apps.map((item, i) => (
                  <Tr key={i}>
                    <Td>{i + 1}</Td>
                    <Td>{item.name}</Td>
                    <Td>{item['share.collection']}</Td>
                    <Td>{item.intro}</Td>
                    <Td>
                      <Button variant={'whiteBase'} size={'sm'} onClick={() => setAppDetail(item)}>
                        详情
                      </Button>
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
      </Box>
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
          <Box flex={'0 0 120px'}>收藏数:</Box>
          <Box>{app['share.collection']}</Box>
        </Flex>
      </ModalBody>
    </MyModal>
  );
}

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
