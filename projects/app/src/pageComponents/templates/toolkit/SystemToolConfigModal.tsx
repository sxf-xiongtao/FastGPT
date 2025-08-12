import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  ModalBody,
  ModalFooter,
  Switch,
  VStack,
  Flex,
  Text,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useFieldArray, useForm } from 'react-hook-form';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput';
import { getSystemPlugins, putUpdatePlugin } from '@/web/core/app/plugin/api';
import type { SystemPluginTemplateItemType } from '@fastgpt/global/core/app/plugin/type';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import type { InputConfigType } from '@fastgpt/global/core/workflow/type/io';
import type { UpdateToolFormType } from '@/pages/api/admin/core/app/plugin/update';
import MyDivider from '@fastgpt/web/components/common/MyDivider';

const COST_LIMITS = { max: 1000, min: 0, step: 0.1 };

const defaultPlugin: SystemPluginTemplateItemType = {
  id: '',
  name: '',
  avatar: '',
  version: '',
  workflow: { nodes: [], edges: [] },
  originCost: 0,
  currentCost: 0,
  hasTokenFee: false,
  templateType: FlowNodeTemplateTypeEnum.other,
  isActive: false
};

const SystemToolConfigModal = ({
  plugin = defaultPlugin,
  onSuccess,
  onClose
}: {
  plugin: SystemPluginTemplateItemType;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const { register, handleSubmit, setValue, watch, control } = useForm<UpdateToolFormType>({
    defaultValues: {
      isActive: plugin.isActive || false,
      originCost: plugin.originCost || 0,
      currentCost: plugin.currentCost || 0,
      hasTokenFee: plugin.hasTokenFee || false,
      systemKeyCost: plugin.systemKeyCost ?? 0,
      inputListVal: plugin.inputListVal
        ? plugin.inputList?.reduce(
            (acc: Record<string, any>, item: InputConfigType) => {
              acc[item.key] = item.value;
              return acc;
            },
            {} as Record<string, any>
          )
        : undefined,
      childConfigs: []
    }
  });

  const [isActive, inputListVal] = watch(['isActive', 'inputListVal']);

  // 是否显示系统密钥配置
  const showSystemSecretInput = useMemo(() => {
    return !!plugin.inputList && plugin.inputList.length > 0;
  }, [plugin.inputList]);

  // Toolset child configs
  const { fields: childConfigs, replace: replaceChildConfigs } = useFieldArray({
    control: control,
    name: 'childConfigs'
  });

  const { data: childTools = [], loading: loadingChild } = useRequest2(
    () => getSystemPlugins(plugin.id),
    {
      onSuccess(res) {
        replaceChildConfigs(
          res.map((tool) => {
            return {
              pluginId: tool.id,
              isActive: tool.isActive || false,
              originCost: tool.originCost || 0,
              currentCost: tool.currentCost || 0,
              hasTokenFee: tool.hasTokenFee || false,
              systemKeyCost: tool.systemKeyCost || 0
            };
          })
        );
        return res;
      },
      refreshDeps: [plugin.id],
      manual: !plugin.isFolder
    }
  );

  const { runAsync: onSubmit, loading } = useRequest2(
    (formData: UpdateToolFormType) =>
      putUpdatePlugin({
        pluginId: plugin.id,
        ...formData
      }),
    {
      successToast: '配置成功',
      onSuccess() {
        onSuccess();
        onClose();
      }
    }
  );

  // Secret input render
  const renderInputField = (item: InputConfigType) => {
    const labelSection = (
      <HStack>
        <Box position={'relative'} fontSize={'sm'} fontWeight={'medium'}>
          {item.required && (
            <Box position={'absolute'} color={'red.600'} left={'-2'} top={'-1'}>
              *
            </Box>
          )}
          {item.label}
        </Box>
        {item.description && <QuestionTip label={item.description} pt={1} />}
      </HStack>
    );

    if (item.inputType === 'switch') {
      return (
        <Box key={item.key}>
          {labelSection}
          <Box mt={1}>
            <Switch {...register(`inputListVal.${item.key}`)} />
          </Box>
        </Box>
      );
    }

    return (
      <Box key={item.key}>
        {labelSection}
        <Box mt={1}>
          <Input
            bg={'myGray.50'}
            {...register(`inputListVal.${item.key}`, {
              required: item.required
            })}
          />
        </Box>
      </Box>
    );
  };
  const systemConfigSection = showSystemSecretInput && !!inputListVal && (
    <>
      <MyDivider my={2} />

      {!plugin.isFolder && (
        <HStack>
          <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
            系统密钥价格（n积分/次）
          </Box>
          <MyNumberInput
            width={'100px'}
            register={register}
            name="systemKeyCost"
            {...COST_LIMITS}
          />
        </HStack>
      )}
      {plugin.inputList?.map(renderInputField)}
    </>
  );

  return (
    <MyModal
      isOpen
      title={`${plugin?.name}配置`}
      iconSrc={plugin.avatar}
      onClose={onClose}
      width={plugin.isFolder ? '900px' : '450px'}
      height={plugin.isFolder ? '500px' : 'auto'}
      maxW={plugin.isFolder ? '900px' : '600px'}
      bg={'white'}
      isLoading={loadingChild}
    >
      <ModalBody>
        {plugin.isFolder ? (
          <Flex gap={5}>
            <Flex flexDirection={'column'} gap={5} flex={'0 0 300px'}>
              <Box fontWeight={'medium'} color={'myGray.900'}>
                基础配置
              </Box>

              <HStack>
                <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
                  是否启用工具集
                </Box>
                <Switch
                  isChecked={isActive}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setValue('isActive', val);
                  }}
                />
              </HStack>

              {showSystemSecretInput && (
                <>
                  <HStack>
                    <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
                      是否配置系统密钥
                    </Box>
                    <Switch
                      isChecked={!!inputListVal}
                      onChange={(e) => {
                        const val = e.target.checked;
                        if (val) {
                          // @ts-ignore
                          setValue('inputListVal', {});
                        } else {
                          setValue('inputListVal', undefined);
                        }
                      }}
                    />
                  </HStack>
                  {systemConfigSection}
                </>
              )}
            </Flex>

            <Flex flex={'3 0 0'} flexDirection={'column'}>
              <Box mb={4} fontWeight={'medium'} color={'myGray.900'}>
                工具列表
              </Box>
              <TableContainer>
                <Table size="sm">
                  <Thead bg={'myGray.50'}>
                    <Tr>
                      <Th fontSize="xs" py={2} px={2} width="50px">
                        工具名
                      </Th>
                      <Th fontSize="xs" py={2} px={2} width="50px">
                        是否启用
                      </Th>
                      {/* <Th fontSize="xs" py={2} px={2} width="120px" >
                        调用价格（n积分/次）
                      </Th> */}
                      <Th fontSize="xs" py={2} px={2} width="50px">
                        密钥价格
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {childTools.map((tool, index) => {
                      return (
                        <Tr key={tool.id}>
                          <Td fontSize="xs">
                            <Text fontSize="xs" fontWeight="medium">
                              {parseI18nString(tool.name)}
                            </Text>
                          </Td>
                          <Td fontSize="xs">
                            <Switch size={'sm'} {...register(`childConfigs.${index}.isActive`)} />
                          </Td>
                          {/* <Td fontSize="xs"  >
                            <MyNumberInput
                              width={'80px'}
                              value={config.currentCost}
                              onChange={(e) =>
                                updateChildToolConfig(tool.id, 'currentCost', e ?? 0)
                              }
                              {...COST_LIMITS}
                              isDisabled={!isActive}
                            />
                          </Td> */}
                          <Td fontSize="xs">
                            <MyNumberInput
                              width={'100px'}
                              register={register}
                              name={`childConfigs.${index}.systemKeyCost`}
                              {...COST_LIMITS}
                            />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Flex>
          </Flex>
        ) : (
          <Flex flexDirection={'column'} gap={5}>
            <HStack>
              <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
                是否启用
              </Box>
              <Switch {...register('isActive')} />
            </HStack>
            {/* <HStack>
              <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
                调用价格 (n积分/次)
              </Box>
              <MyNumberInput
                width={'100px'}
                register={register}
                name="currentCost"
                {...COST_LIMITS}
                ml={8}
              />
            </HStack> */}

            {showSystemSecretInput && (
              <>
                <HStack>
                  <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
                    是否配置系统密钥
                  </Box>
                  <Switch
                    isChecked={!!inputListVal}
                    onChange={(e) => {
                      const val = e.target.checked;
                      if (val) {
                        // @ts-ignore
                        setValue('inputListVal', {});
                      } else {
                        setValue('inputListVal', undefined);
                      }
                    }}
                  />
                </HStack>
                {systemConfigSection}
              </>
            )}
          </Flex>
        )}
      </ModalBody>
      <ModalFooter>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          确认
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default SystemToolConfigModal;
