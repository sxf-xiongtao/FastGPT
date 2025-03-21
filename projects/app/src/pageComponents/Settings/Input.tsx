import { Box, Input } from '@chakra-ui/react';
import FormLabel from './FormLabel';
import { Control, Controller } from 'react-hook-form';

export type InputProps<T = 'text' | 'number'> = {
  placeholder?: string;
  title: string;
  description?: string;
  onChange: (value: any) => void;
  value: T extends 'number' ? number : string;
  type: T;
};

function MyInput({ value, onChange, type, placeholder }: InputProps) {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={
        type === 'number'
          ? (e) => {
              Number(onChange(e.target.value));
            }
          : (e) => {
              onChange(e.target.value);
            }
      }
    />
  );
}

export default MyInput;
