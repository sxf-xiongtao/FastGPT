import type { EditCustomPluginType } from '@/global/core/workflow/plugin/type';
import { putUpdatePlugin } from '@/web/core/app/plugin/api';
import { Box, Flex, Switch } from '@chakra-ui/react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import type {
  DraggableProvided,
  DraggableStateSnapshot
} from '@fastgpt/web/components/common/DndDrag';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'next-i18next';
import type {
  SystemPluginTemplateItemType,
  SystemPluginTemplateListItemType
} from '@fastgpt/global/core/app/plugin/type';
import { PluginSourceEnum } from '@fastgpt/global/core/app/plugin/constants';
import { splitCombinePluginId } from '@fastgpt/global/core/app/plugin/utils';

type PluginItemType = SystemPluginTemplateListItemType & {
  typeLabel?: string;
};
const PluginCard = ({
  plugin,
  setEditCustomTool,
  setConfigSystemTool,
  refreshTools,
  provided,
  snapshot
}: {
  plugin: PluginItemType;
  setEditCustomTool: (value: React.SetStateAction<EditCustomPluginType | undefined>) => void;
  setConfigSystemTool: (
    value: React.SetStateAction<SystemPluginTemplateItemType | undefined>
  ) => void;
  refreshTools: () => void;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}) => {
  const { t } = useTranslation();
  const { runAsync: updateSystemPlugin, loading } = useRequest2(
    async (e: PluginItemType) =>
      putUpdatePlugin({
        pluginId: plugin.id,
        ...e
      }),
    {
      onSuccess: refreshTools
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
        const { source } = splitCombinePluginId(plugin.id);
        if (source === PluginSourceEnum.systemTool) {
          setConfigSystemTool(plugin);
        } else {
          setEditCustomTool({
            ...plugin,
            workflow: undefined
          });
        }
      }}
    >
      <Box display={'flex'} w={1.5 / 10} pl={2}>
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
      <Box w={1 / 10} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'}>
        <Box as={'span'} bg={'myGray.100'} px={2} py={1} color={'myGray.700'} borderRadius={'8px'}>
          {t(plugin?.typeLabel as any)}
        </Box>
      </Box>
      <Box w={3.5 / 10} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'}>
        {plugin?.intro}
      </Box>
      <Box w={1 / 10} pl={4}>
        <Box
          as={'span'}
          onClick={(e: React.MouseEvent) => {
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
      <Box w={1 / 10}>
        {plugin?.associatedPluginId ? (
          <Box
            as={'span'}
            onClick={(e: React.MouseEvent) => {
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
        ) : (
          '-'
        )}
      </Box>
      <Box w={1 / 10}>{plugin?.associatedPluginId ? plugin?.currentCost ?? 0 : '-'}</Box>
      <Box w={1 / 10}>
        {!!plugin?.inputList ? (
          <Box color={plugin?.hasSystemSecret ? 'green.600' : 'myGray.500'}>
            {plugin?.hasSystemSecret ? '已配置' : '未配置'}
          </Box>
        ) : (
          '-'
        )}
      </Box>
    </MyBox>
  );
};

export default PluginCard;
