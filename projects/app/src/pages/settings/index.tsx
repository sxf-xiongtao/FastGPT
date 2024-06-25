import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, useMediaQuery } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { POST } from '@/service/common/request';
import { throttle } from '@/utils/tools';
import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { useQuery } from '@tanstack/react-query';
import { getInitFormData } from '@/web/core/config/api';
import ImportModal from './components/ImportModal';
import FormField from './components/FormField';
import { Controller, useForm } from 'react-hook-form';
import { formConfig } from './data/formConfig';
import FormLabel from './components/FormLabel';

interface formLevel {
  key: string;
  title: string;
  type: string;
  properties?: any;
  description?: string;
}

interface titleType {
  mainTitle: string;
  subTitles: string[];
}

export const Settings = () => {
  const [rawData, setRawData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState<Array<titleType>>([]);
  const [activeTitle, setActiveTitle] = useState('');
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const { toast } = useToast();

  const { reset, control, handleSubmit, setValue } = useForm();

  useQuery(['getInitFormData'], () => getInitFormData(), {
    onSuccess: (data: ConfigStoreType) => {
      setRawData(data);
      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      reset(aggregatedConfigs);
    },
    onError: () => {
      toast({
        title: '获取配置出错',
        status: 'error'
      });
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const formData = formatFormData2ConfigStore(data);
      await POST('/admin/routes/settings/updateConfig', formData);

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

  const handleScroll = throttle(() => {
    let firstVisibleTitle: any = null;

    titles.forEach((title: titleType) => {
      title.subTitles.forEach((subTitle: string) => {
        const subTitleElement = document.getElementById(subTitle);
        if (!subTitleElement) return;

        const subTitleRect = subTitleElement.getBoundingClientRect();
        if (subTitleRect.top <= window.innerHeight && subTitleRect.bottom >= 0) {
          if (
            !firstVisibleTitle ||
            subTitleRect.top < firstVisibleTitle.getBoundingClientRect().top
          ) {
            firstVisibleTitle = subTitleElement;
          }
        }
      });
    });

    if (firstVisibleTitle) {
      setActiveTitle(firstVisibleTitle.id);
    }
  }, 100);

  const firstLevels = Object.values(formConfig);

  useEffect(() => {
    const topLevelKeys = Object.keys(formConfig);

    const secondLevelTitles: { [key: string]: string[] } = {};
    for (const key in formConfig) {
      const properties = formConfig[key].properties;
      const secondLevelTitlesArr = Object.keys(properties).map(
        (propKey) => properties[propKey].title
      );
      secondLevelTitles[key] = secondLevelTitlesArr;
    }

    const formattedOutput = topLevelKeys.map((title) => {
      return { mainTitle: formConfig[title].title, subTitles: secondLevelTitles[title] };
    });

    setTitles(formattedOutput);
    setActiveTitle(formattedOutput[0].mainTitle);
  }, []);

  return (
    <Flex h={'100%'} gap={4}>
      <Box overflowY={'auto'} flex={'1 0 0'} onScroll={handleScroll}>
        {firstLevels.map((firstLevel) => {
          const secondLevels: formLevel[] = Object.values(firstLevel.properties);
          return (
            <Box
              key={firstLevel.title}
              id={firstLevel.title}
              border={'base'}
              boxShadow="md"
              mb={10}
              mr={4}
              p="6"
              rounded="md"
              bg="white"
            >
              <Box fontSize={'xl'} color={'primary.700'} fontWeight={'bold'}>
                {firstLevel.title}
              </Box>
              {secondLevels.map((secondLevel) => {
                return (
                  <Box key={secondLevel.title} className="mt-4">
                    {!!secondLevel.properties ? (
                      <Box>
                        <FormLabel
                          title={secondLevel.title}
                          description={secondLevel.description || ''}
                          level={2}
                        />
                        <Box className="flex flex-wrap">
                          {Object.values(secondLevel.properties).map((thirdLevel) => {
                            const thirdLevelTyped = thirdLevel as formLevel;
                            return (
                              <Box
                                key={thirdLevelTyped.title}
                                className={
                                  thirdLevelTyped.type === 'boolean' ? 'mt-4 w-1/2' : 'mt-4 w-full'
                                }
                              >
                                <Controller
                                  control={control}
                                  name={thirdLevelTyped.key}
                                  render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <FormField
                                      type={thirdLevelTyped.type}
                                      title={thirdLevelTyped.title}
                                      description={thirdLevelTyped.description || ''}
                                      value={value}
                                      onChange={(value) => {
                                        console.log(thirdLevelTyped.key, value);
                                        onChange(value);
                                        setValue(thirdLevelTyped.key, value);
                                      }}
                                      level={3}
                                    />
                                  )}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ) : (
                      <Controller
                        control={control}
                        name={secondLevel.key}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                          <FormField
                            type={secondLevel.type}
                            title={secondLevel.title}
                            description={secondLevel.description || ''}
                            value={value}
                            onChange={onChange}
                            level={2}
                          />
                        )}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
      <Flex
        maxW={'200px'}
        flexDirection={'column'}
        position={isMobile ? 'absolute' : 'relative'}
        bottom={0}
        right={0}
        gap={4}
      >
        <Box
          flex={'1 0 0'}
          overflowY={'auto'}
          className="bg-white w-full pr-6 pt-8"
          hidden={isMobile}
        >
          <ul className="flex flex-col text-lg">
            {titles.map((title: titleType) => (
              <Box key={title.mainTitle}>
                <li
                  className={
                    activeTitle === title.mainTitle
                      ? 'pl-4 text-blue-500 cursor-pointer border-l-4 border-blue-500 text-base'
                      : 'pl-4 border-l-4 border-transparent text-gray-500 hover:text-blue-500 cursor-pointer text-base'
                  }
                  onClick={() => {
                    const anchor = document.getElementById(title.mainTitle);
                    if (anchor) {
                      anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
                    }
                  }}
                >
                  {title.mainTitle}
                </li>
                {title?.subTitles.map((subTitle: string) => (
                  <li
                    key={subTitle}
                    className={
                      activeTitle === subTitle
                        ? 'pl-8 text-blue-500 cursor-pointer border-l-4 border-blue-500 text-base'
                        : 'pl-8 border-l-4 border-transparent text-gray-500 hover:text-blue-500 cursor-pointer text-base'
                    }
                    onClick={() => {
                      const anchor = document.getElementById(subTitle);
                      if (anchor) {
                        anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
                      }
                    }}
                  >
                    {subTitle}
                  </li>
                ))}
              </Box>
            ))}
          </ul>
        </Box>
        <Box className="w-full px-6 flex-col flex">
          <ImportModal value={rawData} setFormData={reset} setRawData={setRawData}>
            <Button variant={'whiteBase'} mb={3} isLoading={isLoading}>
              配置文件
            </Button>
          </ImportModal>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            保存
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Settings;
