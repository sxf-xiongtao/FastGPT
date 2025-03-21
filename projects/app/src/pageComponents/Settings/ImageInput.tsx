import { compressImgFileAndUpload } from '@/web/common/file/utils';
import { AddIcon } from '@chakra-ui/icons';
import { Box, Input, useToast } from '@chakra-ui/react';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import { title } from 'process';
import FormLabel from './FormLabel';
import React from 'react';
import { Control, FieldValues, useController, UseControllerProps } from 'react-hook-form';

function ImageInput<T extends FieldValues>({ control, name }: UseControllerProps<T>) {
  const toast = useToast();
  const ref = React.useRef<HTMLInputElement>(null);
  const {
    field: { onChange, value }
  } = useController({
    control,
    name
  });
  return (
    <Box className="mt-4 mb-4">
      <Input
        type="file"
        className="hidden"
        accept="image/*"
        ref={ref}
        onChange={async (event) => {
          if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const res = await compressImgFileAndUpload({ file });
            if (res) {
              onChange(res);
            } else {
              toast({
                title: '上传图片失败',
                status: 'error'
              });
            }
          }
        }}
      />
      {value ? (
        <MyImage
          src={value}
          alt="image"
          className="w-28 h-28 cursor-pointer border border-solid border-[#CED5E4]"
          onClick={() => ref?.current?.click()}
          objectFit={'contain'}
        />
      ) : (
        <Box
          className="w-28 h-28 cursor-pointer border border-solid flex justify-center items-center text-2xl"
          onClick={() => ref?.current?.click()}
        >
          <AddIcon />
        </Box>
      )}
    </Box>
  );
}

export default ImageInput;
