import React, { useMemo, useState } from 'react';
import BoxCard from '@/components/common/BoxContainer/Card';
import { Box, Button, Flex, Grid } from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getSystemPlugins } from '@/web/core/app/plugin/api';
import MyBox from '@fastgpt/web/components/common/MyBox';
import Avatar from '@fastgpt/web/components/common/Avatar';
import Tag from '@fastgpt/web/components/common/Tag';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import type { getSystemPluginsResponse } from '@/pages/api/core/app/plugin/getSystemPlugins';
import dynamic from 'next/dynamic';
import CustomPluginConfig, { defaultCustomPluginForm } from './components/CustomPluginConfig';
import type { EditCustomPluginType } from '@/global/core/workflow/plugin/type.d';
import { serviceSideProps } from '@/web/common/i18n';
import { getPluginTemplates } from '@/global/core/workflow/plugin/constants';

const SystemPluginConfig = dynamic(() => import('./components/SystemPluginConfig'), { ssr: false });

const SystemPlugin = () => {
  const { data: plugins = [], run: refreshPlugins } = useRequest2(getSystemPlugins, {
    manual: false
  });
  const [configPlugin, setConfigPlugin] = useState<SystemPluginTemplateItemType>();
  const [editCustomPlugin, setEditCustomPlugin] = useState<EditCustomPluginType>();

  const formatPlugins = useMemo(() => {
    const copy = getPluginTemplates().map<{
      type: FlowNodeTemplateTypeEnum;
      label: string;
      list: getSystemPluginsResponse;
    }>((item) => ({
      type: item.type,
      label: item.label,
      list: []
    }));

    plugins.forEach((item) => {
      const index = copy.findIndex((template) => template.type === item.templateType);
      if (index === -1) return;
      copy[index].list.push(item);
    });
    return copy.filter((item) => item.list.length > 0);
  }, [plugins]);

  return (
    <>
      <BoxCard>
        <Flex mb={1}>
          <Box fontSize={'xl'} flex={1}>
            系统插件配置
          </Box>
          <Button onClick={() => setEditCustomPlugin(defaultCustomPluginForm)}>
            创建自定义插件
          </Button>
        </Flex>
        <Box fontSize={'sm'} color="myGray.600">
          以下系统插件的具体运行逻辑已封装好，你可以按需启用它们。部分系统插件是需要申请并配置对应的
          API key，请根据提示去申请和填写后启用。系统插件允许你配置按调用次数进行积分扣费。
        </Box>
      </BoxCard>
      {/* container */}
      <Box mt={4}>
        {formatPlugins.map((item) => (
          <Box key={item.type} _notLast={{ mb: 4 }}>
            <Box fontWeight={'bold'} color={'myGray.900'}>
              {item.label}
            </Box>
            <Grid
              mt={2}
              gap={4}
              gridTemplateColumns={['1fr', 'repeat(2,1fr)', 'repeat(2,1fr)', 'repeat(3,1fr)']}
            >
              {item.list.map((plugin) => (
                <MyBox
                  key={plugin.id}
                  display={'flex'}
                  flexDirection={'column'}
                  py={3}
                  px={5}
                  cursor={'pointer'}
                  borderWidth={1.5}
                  bg={'white'}
                  borderRadius={'md'}
                  minH={'130px'}
                  position={'relative'}
                  _hover={{
                    boxShadow: '2',
                    borderColor: 'primary.300'
                  }}
                  onClick={() => {
                    if (plugin.customWorkflow) {
                      setEditCustomPlugin({
                        id: plugin.id,
                        templateType: plugin.templateType,
                        name: plugin.name,
                        avatar: plugin.avatar,
                        weight: plugin.weight ?? 10,
                        originCost: plugin.originCost,
                        isActive: plugin.isActive ?? false,
                        inputConfig: plugin.inputConfig ?? [],
                        workflow: plugin.customWorkflow
                      });
                    } else {
                      setConfigPlugin(plugin);
                    }
                  }}
                >
                  <Flex alignItems={'center'} h={'38px'}>
                    <Avatar src={plugin.avatar} borderRadius={'md'} w={'28px'} />
                    <Box mx={3} className="textEllipsis3" flex={'1 0 0'}>
                      {plugin.name}
                    </Box>
                    {plugin.isActive ? (
                      <Tag colorSchema="green">已启用</Tag>
                    ) : (
                      <Tag colorSchema={'gray'}>未启用</Tag>
                    )}
                  </Flex>
                  <Box fontSize={'sm'} pt={3}>
                    {plugin.intro}
                  </Box>
                </MyBox>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>

      {!!configPlugin && (
        <SystemPluginConfig
          plugin={configPlugin}
          onSuccess={refreshPlugins}
          onClose={() => setConfigPlugin(undefined)}
        />
      )}
      {!!editCustomPlugin && (
        <CustomPluginConfig
          defaultForm={editCustomPlugin}
          onSuccess={refreshPlugins}
          onClose={() => setEditCustomPlugin(undefined)}
        />
      )}
    </>
  );
};

export default SystemPlugin;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
