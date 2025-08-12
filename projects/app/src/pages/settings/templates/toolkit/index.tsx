'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, HStack, useDisclosure } from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getPluginGroups, getSystemPlugins, putUpdatePluginOrder } from '@/web/core/app/plugin/api';
import Avatar from '@fastgpt/web/components/common/Avatar';
import type {
  SystemPluginTemplateItemType,
  SystemPluginTemplateListItemType
} from '@fastgpt/global/core/app/plugin/type';
import dynamic from 'next/dynamic';
import { defaultCustomPluginForm } from '@/pageComponents/templates/toolkit/CustomPluginConfig';
import type { EditCustomPluginType } from '@/global/core/workflow/plugin/type.d';
import { serviceSideProps } from '@/web/common/i18n/utils';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useRouter } from 'next/router';
import DndDrag, { Draggable } from '@fastgpt/web/components/common/DndDrag';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import { useTranslation } from 'next-i18next';
import MyBox from '@fastgpt/web/components/common/MyBox';
import type { getSystemPluginsResponse } from '@/pages/api/admin/core/app/plugin/list';

const CustomPluginConfig = dynamic(
  () => import('@/pageComponents/templates/toolkit/CustomPluginConfig'),
  {
    ssr: false
  }
);
const SystemToolConfigModal = dynamic(
  () => import('@/pageComponents/templates/toolkit/SystemToolConfigModal'),
  {
    ssr: false
  }
);
const GroupModal = dynamic(() => import('@/pageComponents/templates/toolkit/GroupConfigModal'), {
  ssr: false
});
const PluginCard = dynamic(() => import('@/pageComponents/templates/toolkit/PluginCard'), {
  ssr: false
});

const Index = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [configPlugin, setConfigSystemTool] = useState<SystemPluginTemplateItemType>();
  const [editCustomPlugin, setEditCustomTool] = useState<EditCustomPluginType>();

  const setSelectedGroup = (groupId: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, group: groupId }
      },
      undefined,
      { shallow: true }
    );
  };

  const {
    data: tools = [],
    run: refreshTools,
    loading: loadingTools
  } = useRequest2(getSystemPlugins, {
    manual: false
  });

  const {
    data: groups = [],
    run: refreshGroups,
    loading: loadingGroups
  } = useRequest2(getPluginGroups, {
    manual: false
  });
  const {
    isOpen: isOpenGroupModal,
    onOpen: onOpenGroupModal,
    onClose: onCloseGroupModal
  } = useDisclosure();
  const selectedGroup = (router.query.group as string) || groups[0]?.groupId;
  const currentGroup = useMemo(() => {
    return groups.find((item) => item.groupId === selectedGroup) || groups[0];
  }, [groups, selectedGroup]);

  const [localPlugins, setLocalPlugins] = useState<getSystemPluginsResponse>([]);

  useEffect(() => {
    if (!currentGroup?.groupTypes || !tools.length) {
      setLocalPlugins([]);
      return;
    }

    const pluginMap = new Map(currentGroup.groupTypes.map((type) => [type.typeId, type.typeName]));

    const newPlugins = tools
      .filter((item) => pluginMap.has(item.templateType))
      .map((item) => ({
        ...item,
        typeLabel: pluginMap.get(item.templateType)
      }));

    setLocalPlugins((prevPlugins) => {
      if (JSON.stringify(prevPlugins) === JSON.stringify(newPlugins)) {
        return prevPlugins;
      }
      return newPlugins;
    });
  }, [currentGroup?.groupId, currentGroup?.groupTypes, tools]);

  return (
    <MyBox isLoading={loadingTools || loadingGroups}>
      <Flex alignItems={'center'}>
        <Flex flex={'1'} overflow={'auto'}>
          {groups?.map((group) => {
            const selected = group.groupId === selectedGroup;
            return (
              <Flex
                key={group.groupName}
                rounded={'md'}
                bg={selected ? 'white' : ''}
                color={selected ? 'primary.700' : ''}
                boxShadow={
                  selected
                    ? '0px 4px 4px 0px rgba(19, 51, 107, 0.05), 0px 0px 1px 0px rgba(19, 51, 107, 0.08)'
                    : ''
                }
                px={3}
                py={2}
                fontWeight={'medium'}
                cursor={'pointer'}
                alignItems={'center'}
                onClick={() => setSelectedGroup(group.groupId)}
                _hover={{ bg: 'white' }}
                maxW={'200px'}
                overflow={'hidden'}
                textOverflow={'ellipsis'}
                whiteSpace={'nowrap'}
                fontSize={'14px'}
                mr={2}
              >
                <Avatar
                  src={group.groupAvatar}
                  w={'16px'}
                  rounded={'sm'}
                  mr={1.5}
                  color={'primary.600'}
                />
                {t(group.groupName as any)}
              </Flex>
            );
          })}
        </Flex>
        <Button onClick={() => onOpenGroupModal()} variant={'whiteBase'} mr={2}>
          分组管理
        </Button>
        <Button
          leftIcon={<MyIcon name="common/addLight" w={'18px'} />}
          onClick={() => {
            if (!currentGroup?.groupTypes.length)
              return toast({
                title: '请先添加属性',
                status: 'warning'
              });
            setEditCustomTool(defaultCustomPluginForm);
          }}
        >
          添加插件
        </Button>
      </Flex>

      <Flex
        bg={'white'}
        h={8}
        mt={5}
        mr={2}
        rounded={'md'}
        alignItems={'center'}
        fontSize={'mini'}
        fontWeight={'medium'}
      >
        <Box w={1.5 / 10} pl={8}>
          名称
        </Box>
        <Box w={1 / 10}>属性</Box>
        <Box w={3.5 / 10}>介绍</Box>
        <Box w={1 / 10} pl={4}>
          启用
        </Box>
        <Box w={1 / 10} display={'flex'} alignItems={'center'}>
          Token 积分
          <QuestionTip
            display={'flex'}
            alignItems={'center'}
            ml={1}
            label={
              '开启该开关后，用户使用该插件，需要支付插件中Token的积分，并且同时会收取调用积分'
            }
          />
        </Box>
        <Box w={1 / 10}>调用积分</Box>
        <HStack spacing={0} w={1 / 10}>
          <Box>系统密钥</Box>
          <QuestionTip
            display={'flex'}
            alignItems={'center'}
            ml={1}
            label={
              '对于需要密钥的工具，您可为其配置系统密钥，用户可通过支付积分的方式使用系统密钥。'
            }
          />
        </HStack>
      </Flex>

      <Box overflow={'auto'} mt={2} h={'calc(100vh - 200px)'}>
        <DndDrag<SystemPluginTemplateListItemType>
          onDragEndCb={async (list: getSystemPluginsResponse) => {
            const newOrder = list.map((item, index) => ({
              pluginId: item.id,
              pluginOrder: index
            }));
            setLocalPlugins(list);
            await putUpdatePluginOrder({ plugins: newOrder });
            refreshTools();
          }}
          dataList={localPlugins}
        >
          {({ provided }) => (
            <Flex
              gap={1}
              flexDirection={'column'}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {localPlugins.length > 0 ? (
                localPlugins.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <PluginCard
                        key={item.id}
                        plugin={item}
                        setEditCustomTool={setEditCustomTool}
                        setConfigSystemTool={setConfigSystemTool}
                        refreshTools={refreshTools}
                        provided={provided}
                        snapshot={snapshot}
                      />
                    )}
                  </Draggable>
                ))
              ) : (
                <EmptyTip text={'暂无插件'} py={2} />
              )}
            </Flex>
          )}
        </DndDrag>
      </Box>

      {!!configPlugin && (
        <SystemToolConfigModal
          plugin={configPlugin}
          onSuccess={refreshTools}
          onClose={() => setConfigSystemTool(undefined)}
        />
      )}
      {!!editCustomPlugin && (
        <CustomPluginConfig
          group={currentGroup}
          defaultForm={editCustomPlugin}
          onSuccess={refreshTools}
          onClose={() => setEditCustomTool(undefined)}
        />
      )}
      {!!isOpenGroupModal && (
        <GroupModal
          onClose={() => onCloseGroupModal()}
          allGroups={groups}
          onSuccess={refreshGroups}
        />
      )}
    </MyBox>
  );
};

export default Index;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content, ['app']))
    }
  };
}
