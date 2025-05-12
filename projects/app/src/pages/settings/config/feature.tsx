import React, { useState, useRef } from 'react';
import { Box, Flex, Input, Textarea } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { throttle } from '@/utils/tools';
import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { getInitFormData, postUpdateConfig } from '@/web/core/config/api';
import FormLabel from './components/FormLabel';
import Switch from '@/pageComponents/Settings/Switch';
import { useForm } from 'react-hook-form';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import FirstTitle from '@/pageComponents/Settings/FirstTitle';
import SettingPage from '@/pageComponents/Settings/SettingPage';
import SecondTitle from '@/pageComponents/Settings/SecondTitle';
import FormItem from '@/pageComponents/Settings/FormItem';
import { compressImgFileAndUpload } from '@/web/common/file/utils';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import { AddIcon } from '@chakra-ui/icons';
import JsonEditor from '@fastgpt/web/components/common/Textarea/JsonEditor';
import NavbarItems from './components/FormField/NavbarItems';
import ImageInput from '@/pageComponents/Settings/ImageInput';
interface titleType {
  mainTitle: string;
  subTitles: string[];
}

export const Settings = () => {
  const [rawData, setRawData] = useState<any>({});
  const { setValue, reset, watch, register, handleSubmit, control } =
    useForm<ConfigFormType['siteSettings']>();

  const { loading: loadingConfig } = useRequest2(getInitFormData, {
    onSuccess: (data: ConfigStoreType) => {
      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      setRawData(aggregatedConfigs);
      reset(aggregatedConfigs.siteSettings);
    },
    errorToast: '获取配置出错',
    manual: false
  });

  const { loading: loadingSave, runAsync: saveConfig } = useRequest2(postUpdateConfig, {
    manual: true,
    successToast: '保存成功',
    errorToast: '保存失败'
  });

  const onSubmit = handleSubmit((data) => {
    if (!rawData) {
      return;
    }
    saveConfig(
      formatFormData2ConfigStore({
        ...rawData,
        siteSettings: data
      })
    );
  });

  const isLoading = loadingConfig || loadingSave;

  const titles: Array<titleType> = [
    {
      mainTitle: '基础配置',
      subTitles: [
        '前端展示配置',
        '个性化配置',
        '全局Script脚本',
        '系统参数',
        'PDF 解析配置',
        '使用限制',
        '侧边栏配置'
      ]
    }
  ];

  return (
    <SettingPage titles={titles} loading={isLoading} onSubmit={onSubmit}>
      <FirstTitle title="功能清单" />
      <SecondTitle title="功能展示配置" />
      <Box
        px={6}
        mb={4}
        _notLast={{
          borderBottomWidth: '1.5px',
          borderBottomColor: 'myGray.200'
        }}
      >
        <Flex px={6} wrap="wrap" justifyContent="space-between" my={3}>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel title="展示团队分享" description="" mb={2} minW={'240px'} />
            <Switch control={control} name="feConfigs.show_team_chat" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel title="展示聊天空白页（都关闭即可）" description="" mb={2} minW={'240px'} />
            <Switch control={control} name="feConfigs.show_emptyChat" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel title="展示邀请好友活动" description="" mb={2} minW={'240px'} />
            <Switch control={control} name="feConfigs.show_promotion" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel title="前端是否展示合规提示文案" description="" mb={2} minW={'240px'} />
            <Switch control={control} name="feConfigs.show_compliance_copywriting" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel
              title="展示飞书数据集"
              description="![](https://oss.laf.dev/lk63dw-fastgpt/show_dataset_feishu.png)\n关闭后，创建数据库时不再显示飞书数据库"
              mb={2}
              minW={'240px'}
            />
            <Switch control={control} name="feConfigs.show_dataset_feishu" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel
              title="展示语雀数据集"
              description="![](https://oss.laf.dev/lk63dw-fastgpt/show_dataset_yuque.png)\n关闭后，创建数据库时不再显示语雀数据库"
              mb={2}
              minW={'240px'}
            />
            <Switch control={control} name="feConfigs.show_dataset_yuque" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel
              title="展示飞书发布渠道"
              description="![](https://oss.laf.dev/lk63dw-fastgpt/show_publish_feishu.png)\n关闭后，发布渠道中不再显示飞书发布渠道"
              mb={2}
              minW={'240px'}
            />
            <Switch control={control} name="feConfigs.show_publish_feishu" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel
              title="展示钉钉发布渠道"
              description="![](https://oss.laf.dev/lk63dw-fastgpt/show_publish_dingtalk.png)\n关闭后，发布渠道中不再显示钉钉发布渠道"
              mb={2}
              minW={'240px'}
            />
            <Switch control={control} name="feConfigs.show_publish_dingtalk" />
          </Flex>
          <Flex alignItems={'center'} my={3} w={['100%', '48%']}>
            <FormLabel
              title="展示公众号发布渠道"
              description="![](https://oss.laf.dev/lk63dw-fastgpt/show_publish_offiaccount.png)\n关闭后，发布渠道中不再显示公众号发布渠道"
              mb={2}
              minW={'240px'}
            />
            <Switch control={control} name="feConfigs.show_publish_offiaccount" />
          </Flex>
        </Flex>
      </Box>
    </SettingPage>
  );
};

export default Settings;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
