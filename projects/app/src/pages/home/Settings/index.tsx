import React, { useState, useRef } from 'react';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';
import { Box, Button, Center, Spinner } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import CustomCheckbox from './components/Customization/CustomCheckbox';
import DescriptionFieldTemplate from './components/Customization/DescriptionFieldTemplate';
import { GET, POST } from '@/service/common/request';
import TitleFieldTemplate from './components/Customization/TitleFieldTemplate';
import { extractThirdLevelTitles } from '@/web/core/config/utils';
import { throttle } from '@/utils/tools';
import {
  formConfig2uiSchema,
  formatConfigStore2FormSchema,
  formatFormConfig,
  formatFormData2ConfigStore
} from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { useQuery } from '@tanstack/react-query';
import { getInitFormConfig, getInitFormData } from '@/web/core/config/api';
import ImportModal from './components/ImportModal';
import { RJSFSchema } from '@rjsf/utils';

const widgets = {
  CheckboxWidget: CustomCheckbox
};

export const Settings = () => {
  const [rawData, setRawData] = useState<any>({});
  const [formData, setFormData] = useState<ConfigFormType>();
  const [isLoading, setIsLoading] = useState(false);
  const [schemaConfig, setSchemaConfig] = useState({});
  const [uiSchema, setUiSchema] = useState({});
  const [titles, setTitles] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState('');
  const [isSchemaLoading, setIsSchemaLoading] = useState(true);
  const { toast } = useToast();
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useQuery(['getInitFormData'], () => getInitFormData(), {
    onSuccess: (data: ConfigStoreType) => {
      setRawData(data);
      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      setFormData(aggregatedConfigs);
    },
    onError: () => {
      toast({
        title: '获取配置出错',
        status: 'error'
      });
    }
  });

  useQuery(['getInitFormConfig'], () => getInitFormConfig(), {
    onSuccess: (data: RJSFSchema) => {
      setUiSchema(formConfig2uiSchema(data));
      setSchemaConfig(formatFormConfig(data));
      setTitles(extractThirdLevelTitles(data));
      setIsSchemaLoading(false);
    },
    onError: () => {
      toast({
        title: '初始化配置失败',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  });

  const onSubmit = async ({ formData }: any) => {
    setIsLoading(true);
    try {
      const data = formatFormData2ConfigStore(formData);

      await POST('/admin/routes/settings/updateConfig', data);

      toast({
        title: '配置保存成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.log(error);

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

  const handleScroll = throttle(() => {
    titles.forEach((title) => {
      const element = document.getElementById(title);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        setActiveTitle(title);
        return;
      }
    });
  }, 100);

  return (
    <div className="w-[90%] m-auto flex space-x-4 h-full pb-4">
      <Box
        className="bg-white mt-8 px-6 py-4 w-3/4 overflow-y-auto"
        style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
        onScroll={handleScroll}
      >
        {(isSchemaLoading || isLoading) && (
          <Center className="h-full text-gray-500">
            <Spinner size={'lg'} />
          </Center>
        )}
        {!!formData && (
          <Form
            schema={schemaConfig}
            onSubmit={onSubmit}
            uiSchema={uiSchema}
            formData={formData}
            validator={validator}
            widgets={widgets}
            templates={{
              DescriptionFieldTemplate,
              TitleFieldTemplate
            }}
            onChange={({ formData }) => setFormData(formData)}
          >
            <Button ref={submitButtonRef} type="submit" className="!hidden"></Button>
          </Form>
        )}
      </Box>
      <Box className="w-1/4 flex flex-col mt-8 justify-between">
        <Box
          className="bg-white w-full pr-6 pt-8 pb-12"
          style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
        >
          <ul className="flex flex-col space-y-4 text-lg">
            {titles.map((title) => (
              <li
                key={title}
                className={
                  activeTitle === title
                    ? 'pl-4 text-blue-500 cursor-pointer border-l-4 border-blue-500'
                    : 'pl-4 border-l-4 border-transparent text-gray-500 hover:text-blue-500 cursor-pointer'
                }
                onClick={() => {
                  const anchor = document.getElementById(title);
                  if (anchor) {
                    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {title}
              </li>
            ))}
          </ul>
        </Box>
        <Box
          className="bg-white w-full px-6 py-4"
          style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
        >
          <ImportModal value={rawData} setFormData={setFormData} setRawData={setRawData}>
            <Button isLoading={isLoading || isSchemaLoading} className="w-full mb-4">
              配置文件
            </Button>
          </ImportModal>
          <Button
            onClick={handleClick}
            isLoading={isLoading || isSchemaLoading}
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
