import Icons from '@/components/Icons';
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure
} from '@chakra-ui/react';
import React from 'react';

export default function DetailModal(props: { data: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data = {} } = props;
  return (
    <>
      <span
        className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer mr-1"
        onClick={onOpen}
      >
        <Icons type="detail" />
      </span>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalHeader>详情</ModalHeader>
          <ModalBody>
            {data &&
              Object.keys(data).map((key: string) => {
                return (
                  <HStack key={key}>
                    <span className="text-md font-bold w-1/3">{key}</span>
                    <span className="text-lg w-2/3 text-end">{data[key]}</span>
                  </HStack>
                );
              })}
          </ModalBody>
          <ModalFooter>
            <Button variant="text" onClick={onClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
