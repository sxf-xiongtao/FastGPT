import { EditCustomPluginType } from '@/global/core/workflow/plugin/type';
import { putUpdatePlugin } from '@/web/core/app/plugin/api';
import { Box, Flex, Switch } from '@chakra-ui/react';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { DraggableProvided, DraggableStateSnapshot } from '@fastgpt/web/components/common/DndDrag';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'react-i18next';

const PluginCard = ({
  plugin,
  setEditCustomPlugin,
  setConfigPlugin,
  refreshPlugins,
  provided,
  snapshot
}: {
  plugin: SystemPluginTemplateItemType & { typeLabel?: string };
  setEditCustomPlugin: (value: React.SetStateAction<EditCustomPluginType | undefined>) => void;
  setConfigPlugin: (value: React.SetStateAction<SystemPluginTemplateItemType | undefined>) => void;
  refreshPlugins: () => void;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}) => {
  const { t } = useTranslation();
  const { runAsync: updateSystemPlugin, loading } = useRequest2(
    async (e: SystemPluginTemplateItemType) => {
      return putUpdatePlugin({
        pluginId: plugin.id,
        ...e
      }).then(() => {
        refreshPlugins();
      });
    }
  );

  return (
    <MyBox
      isLoading={loading}
      display={'flex'}
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        opacity: snapshot.isDragging ? 0.8 : 1
      }}
      pl={2}
      cursor={'pointer'}
      bg={'white'}
      borderRadius={'md'}
      h={12}
      w={'full'}
      border={'1px solid transparent'}
      _hover={{
        borderColor: 'rgba(51, 112, 255, 0.10)',
        bg: 'primary.50'
      }}
      fontSize={'mini'}
      alignItems={'center'}
      onClick={() => {
        if (plugin?.customWorkflow) {
          setEditCustomPlugin({
            id: plugin?.id,
            templateType: plugin?.templateType,
            name: plugin?.name,
            intro: plugin?.intro,
            avatar: plugin?.avatar,
            isActive: plugin?.isActive ?? false,
            inputConfig: plugin?.inputConfig ?? [],
            workflow: plugin?.customWorkflow,
            associatedPluginId: plugin?.associatedPluginId,
            userGuide: plugin?.userGuide,
            hasTokenFee: plugin?.hasTokenFee,
            currentCost: plugin?.currentCost
          });
        } else {
          setConfigPlugin(plugin);
        }
      }}
    >
      <Box display={'flex'} w={2 / 10} pr={6}>
        <Flex
          h={'full'}
          rounded={'xs'}
          mr={2.5}
          onClick={(e) => {
            e.stopPropagation();
          }}
          _hover={{ bg: 'myGray.05' }}
          {...provided.dragHandleProps}
        >
          <MyIcon name="drag" w={'14px'} color={'myGray.500'} cursor={'grab'} />
        </Flex>
        <Avatar src={plugin?.avatar} borderRadius={'xs'} w={'20px'} />
        <Box
          pl={1.5}
          fontWeight={'medium'}
          whiteSpace={'nowrap'}
          overflow={'hidden'}
          textOverflow={'ellipsis'}
        >
          {plugin?.name}
        </Box>
        {plugin?.isOfficial && (
          <Box color={'myGray.500'} ml={3} whiteSpace={'nowrap'}>
            官方
          </Box>
        )}
      </Box>
      <Box w={1 / 10} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'} pl={4}>
        <Box as={'span'} bg={'myGray.100'} px={2} py={1} color={'myGray.700'} borderRadius={'8px'}>
          {t(plugin?.typeLabel as any)}
        </Box>
      </Box>
      <Box w={4 / 10} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'} pr={6}>
        {plugin?.intro}
      </Box>
      <Box w={1 / 10} pl={8}>
        <Box
          as={'span'}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const newPlugin = {
              ...plugin,
              isActive: !plugin?.isActive
            };
            updateSystemPlugin(newPlugin);
          }}
        >
          <Switch isChecked={plugin?.isActive} size={'sm'} />
        </Box>
      </Box>
      <Box w={1 / 10} pl={8}>
        <Box
          as={'span'}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const newPlugin = {
              ...plugin,
              hasTokenFee: !plugin?.hasTokenFee
            };
            updateSystemPlugin(newPlugin);
          }}
        >
          <Switch isChecked={plugin?.hasTokenFee} size={'sm'} />
        </Box>
      </Box>
      <Box w={1 / 10} pl={8}>
        {plugin?.currentCost ?? 0}
      </Box>
    </MyBox>
  );
};

export default PluginCard;
