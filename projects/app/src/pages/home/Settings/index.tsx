import React, { useEffect, useState, useRef } from 'react';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';
import styles from './index.module.scss';
import { Box, Button, Center, Spinner, useToast } from '@chakra-ui/react';
import CustomCheckbox from './Customization/CustomCheckbox';
import DescriptionFieldTemplate from './Customization/DescriptionFieldTemplate';
import { GET, POST } from '@/service/common/request';
import { uiSchema } from '@/service/admin/formUISchema';
import TitleFieldTemplate from './Customization/TitleFieldTemplate';

const widgets = {
  CheckboxWidget: CustomCheckbox
};

export const Settings = () => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [schemaConfig, setSchemaConfig] = useState({});
  const [isSchemaLoading, setIsSchemaLoading] = useState(true);
  const toast = useToast();
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const fetchConfig = async () => {
    try {
      const response: Record<string, any> = await GET('/admin/settings/getConfig');
      const aggregatedConfigs = response.latestConfigs.reduce(
        (result: Record<string, any>, config: Record<string, any>) => {
          result[config.type] = config.value;
          return result;
        },
        {}
      );
      if (!response.error) {
        setFormData(aggregatedConfigs);
      } else {
        toast({
          title: '获取配置失败',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      }
    } catch (error) {
      toast({
        title: '获取配置出错',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchInitConfig = async () => {
      try {
        const response = await fetch('/api/system/getInitData');
        const config = await response.json();
        setSchemaConfig(config);
      } catch (error) {
        toast({
          title: '获取初始化配置失败',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsSchemaLoading(false);
      }
    };

    fetchInitConfig();
  }, [toast]);

  const onSubmit = async ({ formData }: any) => {
    setIsLoading(true);
    try {
      const response: any = await POST('/admin/settings/updateConfig', formData);
      if (!response.error) {
        toast({
          title: '配置保存成功',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top'
        });
        fetchConfig();
      }
    } catch (error) {
      toast({
        title: '保存配置出错',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (submitButtonRef.current) {
      submitButtonRef.current.click();
    }
  };

  return (
    <div className="w-[90%] m-auto flex space-x-4 h-full pb-4">
      <Box
        className="bg-white mt-8 px-6 py-4 w-3/4 overflow-y-auto"
        style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
      >
        {isSchemaLoading ? (
          <Center className="h-full text-gray-500">
            <Spinner size={'lg'} />
          </Center>
        ) : (
          <Form
            schema={schemaConfig}
            onSubmit={onSubmit}
            uiSchema={uiSchema}
            className={styles.myForm}
            formData={formData}
            validator={validator}
            widgets={widgets}
            templates={{ DescriptionFieldTemplate, TitleFieldTemplate }}
          >
            <Button ref={submitButtonRef} type="submit" className="!hidden"></Button>
          </Form>
        )}
      </Box>
      <Box className="w-1/4 flex flex-col mt-8 justify-between">
        <Box
          className="bg-white w-full px-6 py-4 flex-1 min-h-[200px] max-h-[360px]"
          style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
        >
          aaa
        </Box>
        <Box
          className="bg-white w-full px-6 py-4"
          style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
        >
          <Button
            onClick={handleClick}
            isLoading={isLoading}
            className="w-full !bg-blue-500 !text-white hover:!bg-blue-600 "
          >
            保存
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Settings;
