import {
  Button,
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

export default function DetailModal(props: { children: React.ReactElement; data: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { children, data } = props;
  return (
    <>
      {React.cloneElement(children, {
        onClick: (e: any) => {
          e.stopPropagation();
          onOpen();
        }
      })}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>详情</ModalHeader>
          <ModalBody>
            {Object.keys(data).map((key: string) => {
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
