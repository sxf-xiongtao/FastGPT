import { putUpdateTemplate } from '@/web/core/app/templates/api';
import { Box, Checkbox, Flex, Switch } from '@chakra-ui/react';
import { AppTemplateTypeEnum, AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { AppTemplateSchemaType } from '@fastgpt/global/core/app/type';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { DraggableProvided, DraggableStateSnapshot } from '@fastgpt/web/components/common/DndDrag';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'next-i18next';
import { defaultTemplate } from './ItemConfigModal';
import React from 'react';
import dynamic from 'next/dynamic';

const map = {
  [AppTypeEnum.simple]: '简易应用',
  [AppTypeEnum.workflow]: '工作流',
  [AppTypeEnum.plugin]: '插件'
};

const TemplateCard = ({
  template = defaultTemplate,
  setCurrentTemplate,
  provided,
  snapshot,
  property,
  refreshTemplates
}: {
  template: AppTemplateSchemaType;
  setCurrentTemplate: (template: AppTemplateSchemaType) => void;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  property: string;
  refreshTemplates: () => void;
}) => {
  const { t } = useTranslation();
  const isRecommend = template.tags.includes('recommendation');

  const { runAsync: updateSystemTemplate, loading } = useRequest2(
    async (e: AppTemplateSchemaType) => {
      return putUpdateTemplate(e);
    },
    {
      onSuccess: () => {
        refreshTemplates();
      }
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
        setCurrentTemplate(template);
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
        <Avatar src={template?.avatar} borderRadius={'xs'} w={'20px'} />
        <Box
          pl={1.5}
          fontWeight={'medium'}
          whiteSpace={'nowrap'}
          overflow={'hidden'}
          textOverflow={'ellipsis'}
        >
          {template?.name}
        </Box>
      </Box>
      <Box w={1 / 10} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'}>
        <Box as={'span'} bg={'myGray.100'} px={2} py={1} color={'myGray.700'} borderRadius={'8px'}>
          {t(property as any)}
        </Box>
      </Box>
      <Box w={4 / 10} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'} pl={4}>
        {template?.intro}
      </Box>
      <Box w={1 / 10} pl={8}>
        <Box
          as={'span'}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            const newTemplate = {
              ...template,
              isActive: !template?.isActive
            };
            updateSystemTemplate(newTemplate);
          }}
        >
          <Switch isChecked={template.isActive} />
        </Box>
      </Box>
      <Box w={1 / 10} pl={3}>
        <Box as={'span'} fontWeight={'medium'} color={'myGray.600'}>
          {map[template?.type as keyof typeof map]}
        </Box>
      </Box>
      <Flex
        alignItems={'center'}
        w={1 / 10}
        pl={3}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const newTemplate = {
            ...template,
            tags: isRecommend
              ? template.tags.filter((tag) => tag !== AppTemplateTypeEnum.recommendation)
              : [...template.tags, AppTemplateTypeEnum.recommendation]
          };
          updateSystemTemplate(newTemplate);
        }}
      >
        <Checkbox isChecked={isRecommend} size={'lg'} />
      </Flex>
    </MyBox>
  );
};

export default dynamic(() => Promise.resolve(TemplateCard), {
  ssr: false
});
