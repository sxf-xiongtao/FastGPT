import React, { useEffect, useState, useRef } from 'react';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';
import { Box, Button, Center, Spinner, useToast } from '@chakra-ui/react';
import CustomCheckbox from './Customization/CustomCheckbox';
import DescriptionFieldTemplate from './Customization/DescriptionFieldTemplate';
import { GET, POST } from '@/service/common/request';
import { uiSchema, defaultConfig } from '@/service/admin/formData';
import TitleFieldTemplate from './Customization/TitleFieldTemplate';
import { extractThirdLevelTitles } from '@/utils/web/extractTitles';
import { throttle } from '@/utils/tools';
import { deepMerge, mapFeConfig, stripFeConfig, stripModels } from '@/utils/web/merge';

const widgets = {
  CheckboxWidget: CustomCheckbox
};

export const Settings = () => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [schemaConfig, setSchemaConfig] = useState({});
  const [titles, setTitles] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState('');
  const [isSchemaLoading, setIsSchemaLoading] = useState(true);
  const toast = useToast();
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const fetchConfig = async () => {
    try {
      const response: Record<string, any> = await GET('/admin/routes/settings/getConfig');
      const aggregatedConfigs = response.latestConfigs.reduce(
        (result: Record<string, any>, config: Record<string, any>) => {
          if (config.type === 'fastgpt') {
            result[config.type] = {
              FeConfig: mapFeConfig(config.value.FeConfig),
              ...stripModels(config.value)
            };
          } else if (config.type === 'fastgptPro') {
            result[config.type] = { ...config.value };
          }

          return result;
        },
        {}
      );
      if (!response.error) {
        setFormData(deepMerge(defaultConfig, aggregatedConfigs));
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

  const fetchInitConfig = async () => {
    try {
      const response = await fetch('/api/system/getInitData');
      const config = await response.json();
      setSchemaConfig(config);
      setTitles(extractThirdLevelTitles(config));
    } catch (error) {
      console.log(error);
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

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchInitConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async ({ formData }: any) => {
    setIsLoading(true);
    try {
      const response: any = await POST('/admin/settings/updateConfig', {
        fastgpt: { ...formData.fastgpt.models, ...stripFeConfig(formData.fastgpt) },
        fastgptPro: formData.fastgptPro
      });
      if (!response.error) {
        toast({
          title: '配置保存成功',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top'
        });
        await fetchConfig();
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
        {isSchemaLoading || isLoading ? (
          <Center className="h-full text-gray-500">
            <Spinner size={'lg'} />
          </Center>
        ) : (
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
          >
            <Button ref={submitButtonRef} type="submit" className="!hidden"></Button>
          </Form>
        )}
      </Box>
      <Box className="w-1/4 flex flex-col mt-8 justify-between">
        <Box
          className="bg-white w-full pr-6 pt-8 pb-12 max-h-[360px]"
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
