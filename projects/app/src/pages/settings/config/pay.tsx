import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, HStack, Switch, useMediaQuery } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { throttle } from '@/utils/tools';
import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { useQuery } from '@tanstack/react-query';
import { getInitFormData, postUpdateConfig } from '@/web/core/config/api';
import ImportModal from './components/ImportModal';
import FormField from './components/FormField';
import { Controller, useForm } from 'react-hook-form';
import { PayFormConfig } from './data/formConfig';
import BoxCard from '@/components/common/BoxContainer/Card';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';
import { useSystem } from '@fastgpt/web/hooks/useSystem';

let defaultStandardValue =
  '{"free":{"name":"免费版","price":0,"pointPrice":0,"totalPoints":100,"maxTeamMember":1,"maxAppAmount":10,"maxDatasetAmount":10,"chatHistoryStoreDuration":30,"maxDatasetSize":600,"trainingWeight":1,"permissionCustomApiKey":false,"permissionCustomCopyright":false,"permissionWebsiteSync":false,"permissionReRank":false},"experience":{"name":"体验版","price":59,"pointPrice":30,"totalPoints":3000,"maxTeamMember":3,"maxAppAmount":30,"maxDatasetAmount":30,"chatHistoryStoreDuration":180,"maxDatasetSize":5000,"trainingWeight":2,"permissionCustomApiKey":true,"permissionCustomCopyright":false,"permissionWebsiteSync":true,"permissionReRank":true},"team":{"name":"团队版","price":399,"pointPrice":200,"totalPoints":20000,"maxTeamMember":10,"maxAppAmount":100,"maxDatasetAmount":100,"chatHistoryStoreDuration":360,"maxDatasetSize":40000,"trainingWeight":3,"permissionCustomApiKey":true,"permissionCustomCopyright":true,"permissionWebsiteSync":true,"permissionReRank":true},"enterprise":{"name":"企业版","price":999,"pointPrice":600,"totalPoints":60000,"maxTeamMember":100,"maxAppAmount":500,"maxDatasetAmount":500,"chatHistoryStoreDuration":720,"maxDatasetSize":150000,"trainingWeight":4,"permissionCustomApiKey":true,"permissionCustomCopyright":true,"permissionWebsiteSync":true,"permissionReRank":true}}';

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

const PLAN_KEY = 'paySettings.subPlans';

export const ModelSettings = () => {
  const [rawData, setRawData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState<Array<titleType>>([]);
  const [activeTitle, setActiveTitle] = useState('');
  const { isPc } = useSystem();

  const [openPlan, setOpenPlan] = useState<boolean>(false);

  const { toast } = useToast();

  const { reset, control, handleSubmit, getValues, setValue } = useForm();

  useQuery(['getInitFormData'], () => getInitFormData(), {
    onSuccess: (data: ConfigStoreType) => {
      setRawData(data);

      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      reset(aggregatedConfigs);

      if (
        !!aggregatedConfigs.paySettings.subPlans &&
        aggregatedConfigs.paySettings.subPlans.standard !== '{}'
      ) {
        setOpenPlan(true);
      } else {
        setOpenPlan(false);
      }
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

      await postUpdateConfig(formData);

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

  const formConfig = PayFormConfig;
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
  }, [formConfig]);

  return (
    <Flex h={'100%'} gap={4}>
      <Box overflowY={'auto'} flex={'1 0 0'} onScroll={handleScroll}>
        {firstLevels.map((firstLevel) => {
          const secondLevels: formLevel[] = Object.values(firstLevel.properties);
          return (
            <Box
              key={firstLevel.title}
              id={firstLevel.title}
              mb={10}
              border={'base'}
              borderRadius={'lg'}
              boxShadow={'3'}
              bg={'white'}
              overflow={'hidden'}
            >
              <Box
                fontSize={'lg'}
                color={'myGray.900'}
                fontWeight={'bold'}
                bg={'myGray.100'}
                px={4}
                py={2}
              >
                {firstLevel.title}
              </Box>
              {firstLevel.key === PLAN_KEY && (
                <Box px={6} pt={5} pb={openPlan ? 0 : 5}>
                  <HStack>
                    <Box>是否启用订阅套餐</Box>
                    <Switch
                      isChecked={openPlan}
                      onChange={(e) => {
                        const val = e.target.checked;

                        if (val) {
                          setValue('paySettings.subPlans.standard', defaultStandardValue);
                          setOpenPlan(true);
                        } else {
                          const standard = getValues('paySettings.subPlans.standard');
                          defaultStandardValue = standard;

                          setValue('paySettings.subPlans.standard', '{}');
                          setOpenPlan(false);
                        }
                      }}
                    />
                  </HStack>
                </Box>
              )}
              {firstLevel.key === PLAN_KEY && !openPlan
                ? null
                : secondLevels.map((secondLevel) => {
                    return (
                      <Box
                        key={secondLevel.title}
                        px={6}
                        py={6}
                        _notLast={{
                          borderBottomWidth: '1.5px',
                          borderBottomColor: 'myGray.200'
                        }}
                      >
                        {!!secondLevel.properties ? (
                          <Box>
                            <Flex id={secondLevel.title} color={'primary.600'} mb={5}>
                              <MyTag fontSize={'md'} type="borderFill">
                                {secondLevel.title}
                              </MyTag>
                            </Flex>
                            <Flex pl={2} flexWrap={'wrap'}>
                              {Object.values(secondLevel.properties).map((thirdLevel) => {
                                const thirdLevelTyped = thirdLevel as formLevel;
                                return (
                                  <Box
                                    key={thirdLevelTyped.title}
                                    {...(thirdLevelTyped.type === 'boolean'
                                      ? {
                                          w: '50%'
                                        }
                                      : {
                                          w: '100%',
                                          _notFirst: { mt: 5 }
                                        })}
                                  >
                                    <Controller
                                      control={control}
                                      name={thirdLevelTyped.key}
                                      render={({ field: { onChange, value } }) => (
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
                            </Flex>
                          </Box>
                        ) : (
                          <Controller
                            control={control}
                            name={secondLevel.key}
                            render={({ field: { onChange, value } }) => (
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
      {/* 目录 */}
      <Flex
        flex={'0 0 200px'}
        flexDirection={'column'}
        position={isPc ? 'relative' : 'absolute'}
        gap={4}
      >
        <BoxCard
          flex={'1 0 0'}
          overflow={'overlay'}
          display={['none', 'block']}
          userSelect={'none'}
          px={4}
          py={4}
        >
          <Box>
            {titles.map((title: titleType) => (
              <Box key={title.mainTitle}>
                <Box
                  {...(activeTitle === title.mainTitle
                    ? {
                        bg: 'primary.600',
                        color: 'white'
                      }
                    : {
                        _hover: {
                          color: 'primary.600'
                        },
                        onClick: () => {
                          const anchor = document.getElementById(title.mainTitle);
                          if (anchor) {
                            anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
                          }
                        }
                      })}
                  py={1}
                  px={2}
                  borderRadius={'md'}
                  cursor={'pointer'}
                >
                  {title.mainTitle}
                </Box>
                <Box ml={3} fontSize={'sm'}>
                  {title?.subTitles.map((subTitle: string) => (
                    <Box
                      key={subTitle}
                      {...(activeTitle === subTitle
                        ? {
                            bg: 'primary.600',
                            color: 'white'
                          }
                        : {
                            _hover: {
                              color: 'primary.600'
                            },
                            onClick: () => {
                              const anchor = document.getElementById(subTitle);
                              if (anchor) {
                                anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
                              }
                            }
                          })}
                      py={1}
                      px={2}
                      borderRadius={'md'}
                      cursor={'pointer'}
                    >
                      {subTitle}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </BoxCard>
        <Box w={'100%'}>
          <Box>
            <ImportModal value={rawData} setFormData={reset} setRawData={setRawData}>
              <Button variant={'whiteBase'} mb={3} w={'100%'} isLoading={isLoading}>
                配置文件
              </Button>
            </ImportModal>
          </Box>
          <Button onClick={handleSubmit(onSubmit)} w={'100%'} isLoading={isLoading}>
            保存
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};

export default ModelSettings;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content, ['user']))
    }
  };
}
