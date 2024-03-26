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
  ModalBody,
  HStack,
  InputGroup,
  Input,
  InputLeftElement
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import { getUsers } from '@/web/admin/users/api';
import UserEditModal from './components/UserEditModal';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import UserAddModal from './components/UserAddModal';

const UserTable = () => {
  const [username, setUsername] = useState<string>();
  const [userDetail, setUserDetail] = useState();
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    data: users,
    setData: setUsers,
    isLoading,
    ScrollData,
    getData
  } = usePagination({
    api: getUsers,
    pageSize: 20,
    params: {
      username
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
      <HStack px={8}>
        <Box className="text-2xl font-bold text-[#405169]">用户信息</Box>
        <Box className="flex-grow"></Box>
        <UserAddModal
          data={{}}
          updateData={() => {
            setUsers([]);
            getData(1);
          }}
        />
        <InputGroup w={200}>
          <InputLeftElement h={'full'}>
            <MyIcon name="common/searchLight" w={4} color={'myGray.400'} />
          </InputLeftElement>
          <Input
            placeholder="请输入用户名，回车搜索"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setUsers([]);
                getData(1);
              }
            }}
            onChange={(e) => setUsername(e.target.value)}
            h={10}
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
                  <Th>用户名</Th>
                  <Th>创建时间</Th>
                  <Th>状态</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody fontSize={'sm'}>
                {users.map((item, i) => (
                  <Tr key={i}>
                    <Td>{i + 1}</Td>
                    <Td>{item.username}</Td>
                    <Td>
                      {item.createTime ? dayjs(item.createTime).format('YYYY/MM/DD HH:mm:ss') : '-'}
                    </Td>
                    <Td>{item.status}</Td>
                    <Td>
                      <Button
                        variant={'whiteBase'}
                        size={'sm'}
                        mr={2}
                        onClick={() => setUserDetail(item)}
                      >
                        详情
                      </Button>
                      <UserEditModal
                        data={item}
                        getData={() => {
                          setUsers([]);
                          getData(1);
                        }}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {!isLoading && users.length === 0 && (
              <Flex
                mt={'20vh'}
                flexDirection={'column'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
                <Box mt={2} color={'myGray.500'}>
                  无用户记录～
                </Box>
              </Flex>
            )}
          </TableContainer>
        </ScrollData>

        {!!userDetail && (
          <UserDetailModal user={userDetail} onClose={() => setUserDetail(undefined)} />
        )}
      </Box>
    </Box>
  );
};

export default UserTable;

function UserDetailModal({ user, onClose }: { user: UserModelSchema; onClose: () => void }) {
  return (
    <MyModal isOpen={true} onClose={onClose} iconSrc="" title={'用户详情'} maxW={['90vw', '700px']}>
      <ModalBody>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>用户名</Box>
          <Box>{user.username}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>创建时间:</Box>
          <Box>{dayjs(user.createTime).format('YYYY/MM/DD HH:mm:ss')}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 120px'}>状态:</Box>
          <Box>{user.status}</Box>
        </Flex>
      </ModalBody>
    </MyModal>
  );
}
