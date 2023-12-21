import Icons from '@/components/Icons';
import {
  Avatar,
  Box,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure
} from '@chakra-ui/react';
import React from 'react';

export default function UserDetailModal(props: { data: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data = {} } = props;
  const { userId, username, balance, createTime } = data;
  const showedData = [
    {
      name: 'id',
      value: userId
    },
    {
      name: '用户名',
      value: username
    },
    {
      name: '余额',
      value: balance
    },
    {
      name: '创建时间',
      value: createTime
    }
  ];

  return (
    <>
      <span
        className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer mr-1"
        onClick={onOpen}
      >
        <Icons type="detail" />
      </span>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalCloseButton className="text-black hover:bg-slate-100" />
          <ModalHeader>详情</ModalHeader>
          <ModalBody>
            <Box className="flex space-x-4 w-full px-6">
              <Box className="w-1/4 pl-4">
                <Avatar src={data.avatar} name={data.username} size={'lg'} />
              </Box>
              <Box className="w-3/4">
                {showedData &&
                  showedData.map((item: { name: string; value: string }) => {
                    return (
                      <HStack key={item.name}>
                        <span className="text-md font-bold w-1/3">{item.name}</span>
                        <span className="text-lg w-2/3 text-end whitespace-nowrap">
                          {item.value}
                        </span>
                      </HStack>
                    );
                  })}
                <HStack>
                  <span className="text-md font-bold w-1/3">所属团队</span>
                  <span className="text-lg w-2/3 text-end">
                    {data.teams &&
                      data.teams.map((team: string) => (
                        <span key={team} className="ml-1">{`[ ${team} ]`}</span>
                      ))}
                  </span>
                </HStack>
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
