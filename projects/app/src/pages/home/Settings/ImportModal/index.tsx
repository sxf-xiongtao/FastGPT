import { ConfigFormType } from '@/global/admin/config';
import { formatConfigStore2FormSchema } from '@/web/core/config/adapt';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import JsonEditor from '@fastgpt/web/components/common/Textarea/JsonEditor';
import React, { useEffect } from 'react';

export default function ImportModal(props: {
  children: React.ReactElement;
  value: any;
  setFormData: any;
  setRawData: any;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { children, value, setFormData, setRawData } = props;
  const [configData, setConfigData] = React.useState<string>('');
  useEffect(() => {
    setConfigData(JSON.stringify(value, null, 2));
  }, [value]);

  const toast = useToast();

  return (
    <>
      {children &&
        React.cloneElement(children, {
          onClick: (e: any) => {
            e.stopPropagation();
            onOpen();
          }
        })}

      <Modal isOpen={isOpen} onClose={onClose} size={'6xl'}>
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalHeader>
            导入配置
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            <JsonEditor
              height={500}
              defaultValue={JSON.stringify(value, null, 2)}
              onChange={(value) => {
                setConfigData(value);
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} className="w-40 mr-4">
              取消
            </Button>
            <Button
              colorScheme="blue"
              mr={3}
              className="w-40"
              onClick={() => {
                console.log('configData', configData);
                try {
                  setRawData(JSON.parse(configData));
                  const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(
                    JSON.parse(configData)
                  );
                  setFormData(aggregatedConfigs);
                  onClose();
                  toast({
                    title: '导入成功，请点击保存',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                    position: 'top'
                  });
                } catch (error: any) {
                  toast({
                    title: '请检查配置文件格式',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                    position: 'top'
                  });
                }
              }}
            >
              导入
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
