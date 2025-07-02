import { Flex, FormLabel, Switch } from '@chakra-ui/react';
import React from 'react';
import type { FieldValues, UseControllerProps } from 'react-hook-form';
import { ChangeHandler, type Control, Controller, useController } from 'react-hook-form';

function MySwitch<T extends FieldValues>(props: UseControllerProps<T>) {
  const { field } = useController(props);
  return <Switch isChecked={field.value} onChange={field.onChange} />;
}
export default MySwitch;
