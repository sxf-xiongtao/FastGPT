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
      <FirstTitle title="基础配置" />
      <SecondTitle title="前端展示配置" />
      <FormItem title="系统名" description="">
        <Input {...register('feConfigs.systemTitle')} placeholder="" />
      </FormItem>
      <FormItem
        title="自定义api域名"
        description="可以设置一个额外的api地址，不使用主站的地址，需配置域名的cname和ssl证书。"
      >
        <Input
          {...register('feConfigs.customApiDomain')}
          placeholder="可以设置一个额外的api地址，不使用主站的地址，需配置域名的cname和ssl证书。"
        />
      </FormItem>
      <FormItem
        title="自定义分享链接域名"
        description="可以设置一个额外的分享链接地址，不使用主站的地址，需配置域名的cname和ssl证书。"
      >
        <Input
          {...register('feConfigs.customSharePageDomain')}
          placeholder="可以设置一个额外的分享链接地址，不使用主站的地址，需配置域名的cname和ssl证书。"
        />
      </FormItem>
      <FormItem title="favicon" description="">
        <ImageInput control={control} name="feConfigs.favicon" />
      </FormItem>
      <FormItem title="OpenAPI 前缀" description="">
        <Input {...register('systemEnv.openapiPrefix')} placeholder="" />
      </FormItem>

      <SecondTitle title="个性化配置" />

      <FormItem
        title="联系弹窗"
        description="使用 Markdown 进行配置，配置之后，在网页中“联系我们”相关的内容，会提示填写的内容。"
      >
        <Textarea
          rows={8}
          variant="outline"
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
          {...register('concatMd')}
          placeholder="使用 Markdown 进行配置，配置之后，在网页中“联系我们”相关的内容，会提示填写的内容。"
        />
      </FormItem>

      <FormItem title="自定义 api 文档地址" description="自定义 openapi 文档地址">
        <Input {...register('feConfigs.openAPIDocUrl')} placeholder="" />
      </FormItem>
      <FormItem title="文档地址（加一个 / 结尾，否则会携带子路径跳转）" description="">
        <Input {...register('feConfigs.docUrl')} placeholder="" />
      </FormItem>
      <FormItem title="贡献插件文档地址" description="">
        <Input {...register('feConfigs.systemPluginCourseUrl')} placeholder="" />
      </FormItem>
      <FormItem title="贡献模板市场文档地址" description="">
        <Input {...register('feConfigs.appTemplateCourse')} placeholder="" />
      </FormItem>

      <SecondTitle title="全局Script脚本" />

      <FormItem
        title="全局 Script 脚本"
        description="自定义 Script 脚本，可以全局插入（可以做站点流量监控之类的）"
      >
        <Box className="mb-8" w={'100%'}>
          <JsonEditor
            value={watch('scripts')}
            onChange={throttle((e) => {
              setValue('scripts', e || '');
            }, 1000)}
            defaultHeight={250}
            resize
          />
        </Box>
      </FormItem>

      <SecondTitle title="系统参数" />
      <FormItem
        title="MCP 转发服务地址"
        description="需要部署一个 MCP 转发服务，用于将 FastGPT 应用以MCP协议暴露，例如：http://localhost:3005"
      >
        <Input {...register('feConfigs.mcpServerProxyEndpoint')} placeholder="" />
      </FormItem>
      <FormItem
        title="oneAPI地址(会覆盖环境变量配置的)"
        description="oneAPI地址，可以使用 oneapi 来实现多模型接入"
      >
        <Input {...register('systemEnv.oneapiUrl')} placeholder="请输入 oneAPI 地址" />
      </FormItem>
      <FormItem title="OneAPI 密钥(会覆盖环境变量配置的)" description="">
        <Input {...register('systemEnv.chatApiKey')} placeholder="请输入 OneAPI 密钥" />
      </FormItem>
      <FormItem title="知识库索引最大处理进程" description="">
        <Input type="number" {...register('systemEnv.vectorMaxProcess')} placeholder="" />
      </FormItem>
      <FormItem title="文件理解模型最大处理进程" description="">
        <Input type="number" {...register('systemEnv.qaMaxProcess')} placeholder="" />
      </FormItem>
      <FormItem title="图片理解模型最大处理进程" description="">
        <Input type="number" {...register('systemEnv.vlmMaxProcess')} placeholder="" />
      </FormItem>
      <FormItem title="HNSW ef_search" description="没有特殊设置过索引的，默认 100 即可">
        <Input type="number" {...register('systemEnv.hnswEfSearch')} placeholder="" />
      </FormItem>
      <FormItem title="token计算最大进程（通常多少并发设置多少）" description="">
        <Input type="number" {...register('systemEnv.tokenWorkers')} placeholder="" />
      </FormItem>
      <SecondTitle title="PDF 解析配置" />
      <FormItem title="自定义 PDF 解析地址" description="">
        <Input {...register('systemEnv.customPdfParse.url')} placeholder="" />
      </FormItem>
      <FormItem title="自定义 PDF 解析密钥" description="">
        <Input {...register('systemEnv.customPdfParse.key')} placeholder="" />
      </FormItem>
      <FormItem title="Doc2x pdf 解析密钥（比自定义 PDF 解析优先级低）" description="">
        <Input {...register('systemEnv.customPdfParse.doc2xKey')} placeholder="" />
      </FormItem>
      <FormItem title="自定义 PDF 解析价格(n 积分/页)" description="">
        <Input type="number" {...register('systemEnv.customPdfParse.price')} placeholder="" />
      </FormItem>
      <SecondTitle title="使用限制" />
      <FormItem
        title="单次最多上传多少个文件"
        description="用户上传知识库时，每次上传最多选择多少个文件"
      >
        <Input type="number" {...register('feConfigs.uploadFileMaxAmount')} placeholder="" />
      </FormItem>
      <FormItem
        title="上传文件最大大小（M)"
        description="用户上传知识库时，每个文件最大是多少。放大的话，需要注意网关也要设置得够大。"
      >
        <Input type="number" {...register('feConfigs.uploadFileMaxSize')} placeholder="" />
      </FormItem>
      <FormItem title="导出间隔时长(分钟)" description="">
        <Input type="number" {...register('limit.exportDatasetLimitMinutes')} placeholder="" />
      </FormItem>
      <FormItem title="站点同步使用间隔时长(分钟)" description="">
        <Input type="number" {...register('limit.websiteSyncLimitMinuted')} placeholder="" />
      </FormItem>
      <SecondTitle title="侧边栏配置" />
      <Box p={6}>
        <NavbarItems
          value={watch('navbar')}
          onChange={(e: any) => {
            setValue('navbar', e);
          }}
          title="侧边栏配置"
          description="移动端的侧边栏显示在账号 - 个人信息里"
        />
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
