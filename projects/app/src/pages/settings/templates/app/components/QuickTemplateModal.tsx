import { Button, Checkbox, Flex, Grid, HStack, ModalBody, ModalFooter } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import MyModal from '@fastgpt/web/components/common/MyModal';
import React, { useState } from 'react';
import SearchInput from '@fastgpt/web/components/common/Input/SearchInput';
import MyAvatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { putUpdateQuickTemplate } from '@/web/core/app/templates/api';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import { AppTemplateSchemaType } from '@fastgpt/global/core/app/type';
import dynamic from 'next/dynamic';

const QuickTemplateModal = ({
  onClose,
  templates = [],
  refreshTemplates
}: {
  onClose: () => void;
  templates: AppTemplateSchemaType[];
  refreshTemplates: () => void;
}) => {
  const [currentAppType, setCurrentAppType] = useState<string>(AppTypeEnum.simple);
  const [searchText, setSearchText] = useState<string>('');

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Record<string, string[]>>(() => {
    const initialState: Record<string, string[]> = {
      [AppTypeEnum.simple]: [],
      [AppTypeEnum.workflow]: [],
      [AppTypeEnum.plugin]: []
    };

    templates.forEach((template) => {
      if (template.isQuickTemplate) {
        initialState[template.type].push(template.templateId);
      }
    });

    return initialState;
  });

  const filterTemplates = templates.filter(
    (template) => template.name.includes(searchText) && template.type === currentAppType
  );

  const currentTypeSelectedIds = selectedTemplateIds[currentAppType];

  const { runAsync: updateQuickTemplate, loading } = useRequest2(
    async (e: string[]) => {
      return putUpdateQuickTemplate({
        templateIds: e
      });
    },
    {
      successToast: '设置成功',
      onSuccess: () => {
        refreshTemplates();
        onClose();
      }
    }
  );

  return (
    <MyModal
      isOpen
      isCentered
      title={'配置快捷模板'}
      iconSrc={'common/setting'}
      iconColor={'primary.600'}
      maxW={['90vw', '900px']}
      w={'100%'}
    >
      <ModalBody>
        <FillRowTabs
          list={[
            { label: '简易应用', value: AppTypeEnum.simple, icon: 'core/app/type/simple' },
            { label: '工作流', value: AppTypeEnum.workflow, icon: 'core/app/type/workflow' },
            { label: '插件', value: AppTypeEnum.plugin, icon: 'core/app/type/plugin' }
          ]}
          value={currentAppType}
          onChange={setCurrentAppType}
        />
        <Flex mt={2}>
          <Grid
            border="1px solid"
            borderColor="myGray.200"
            borderRadius="0.5rem"
            gridTemplateColumns="1fr 1fr"
            w={'full'}
            h={'500px'}
          >
            <Flex
              p={4}
              flexDirection={'column'}
              borderRight={'1px solid'}
              borderColor={'myGray.200'}
              h={'full'}
              overflow={'hidden'}
            >
              <SearchInput
                placeholder={'搜索应用'}
                bgColor="myGray.50"
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Flex flexDirection="column" mt="2" flex={1} overflow={'auto'}>
                {filterTemplates.map((template) => {
                  const isSelected = currentTypeSelectedIds.includes(template.templateId);

                  return (
                    <HStack
                      key={template.templateId}
                      py="2"
                      px="3"
                      borderRadius="sm"
                      alignItems="center"
                      _hover={{
                        bgColor: 'myGray.50',
                        cursor:
                          currentTypeSelectedIds.length >= 3 && !isSelected
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                      onClick={() => {
                        setSelectedTemplateIds((state) => {
                          if (isSelected) {
                            return {
                              ...state,
                              [currentAppType]: state[currentAppType].filter(
                                (v) => v !== template.templateId
                              )
                            };
                          }
                          if (state[currentAppType].length >= 3) return state;
                          return {
                            ...state,
                            [currentAppType]: [...state[currentAppType], template.templateId]
                          };
                        });
                      }}
                    >
                      <Checkbox
                        isChecked={isSelected}
                        isDisabled={currentTypeSelectedIds.length >= 3 && !isSelected}
                      />
                      <MyAvatar src={template.avatar as any} w={'20px'} borderRadius={'sm'} />
                      <Box fontSize={'sm'} color={'myGray.900'}>
                        {template.name}
                      </Box>
                    </HStack>
                  );
                })}
              </Flex>
            </Flex>
            <Flex p={4} flexDirection={'column'} h={'full'} overflow={'hidden'}>
              <Box fontSize={'sm'}>{`已选: ${currentTypeSelectedIds.length} / 3`}</Box>
              <Flex flexDirection="column" mt={2} flex={1} overflow={'auto'}>
                {currentTypeSelectedIds.map((templateId) => {
                  const template = templates.find((v) => String(v.templateId) === templateId);
                  return template ? (
                    <HStack
                      justifyContent="space-between"
                      key={templateId}
                      alignItems="center"
                      py="2"
                      px={3}
                      borderRadius={'md'}
                      _hover={{ bg: 'myGray.50' }}
                      onClick={() =>
                        setSelectedTemplateIds((state) => ({
                          ...state,
                          [currentAppType]: state[currentAppType].filter((v) => v !== templateId)
                        }))
                      }
                    >
                      <MyAvatar src={template.avatar} w={'20px'} borderRadius={'sm'} />
                      <Box w={'full'} fontSize={'sm'} color={'myGray.900'}>
                        {template.name}
                      </Box>
                      <MyIcon
                        name={'common/closeLight'}
                        w={'16px'}
                        cursor={'pointer'}
                        _hover={{
                          color: 'red.600'
                        }}
                      />
                    </HStack>
                  ) : null;
                })}
              </Flex>
            </Flex>
          </Grid>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose} variant={'whiteBase'} mr={3}>
          取消
        </Button>
        <Button
          isLoading={loading}
          onClick={async () => {
            await updateQuickTemplate(Object.values(selectedTemplateIds).flat());
          }}
        >
          保存
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default dynamic(() => Promise.resolve(QuickTemplateModal), {
  ssr: false
});
