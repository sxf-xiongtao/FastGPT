import { Box, Image, Input, NumberInput, Switch, Textarea } from '@chakra-ui/react';
import JsonEditor from '@fastgpt/web/components/common/Textarea/JsonEditor';
import { useRef } from 'react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { compressImgFileAndUpload } from '@/service/admin/compressAndUpload';
import { AddIcon } from '@chakra-ui/icons';
import FormLabel from '../FormLabel';

const FormField = ({
  type,
  title,
  description,
  value,
  onChange,
  level
}: {
  type: string;
  title: string;
  description: string;
  value?: any;
  onChange: (value: any) => void;
  level: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (type === 'boolean') {
    return (
      <Box className="flex items-center w-[70%] justify-between pb-8 flex-0">
        <FormLabel title={title} description={description} level={level} />
        <Switch
          className="ml-4"
          isChecked={value}
          onChange={(e) => {
            onChange(e.target.checked);
          }}
        />
      </Box>
    );
  }
  if (type === 'string') {
    return (
      <Box>
        <FormLabel title={title} description={description} level={level} />

        <Input defaultValue={value} onChange={(e) => onChange(e.target.value)} />
      </Box>
    );
  }
  if (type === 'number') {
    return (
      <Box>
        <FormLabel title={title} description={description} level={level} />
        <Input defaultValue={value} onChange={(e) => onChange(Number(e.target.value))} />
      </Box>
    );
  }
  if (type === 'image') {
    return (
      <Box className="mt-4 mb-8">
        <FormLabel title={title} description={description} level={level} />
        <Input
          type="file"
          className="hidden"
          ref={inputRef}
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
          <Image
            src={value}
            alt="image"
            className="w-28 h-28 cursor-pointer border border-solid border-[#CED5E4]"
            onClick={() => inputRef.current?.click()}
            objectFit={'contain'}
          />
        ) : (
          <Box
            className="w-28 h-28 cursor-pointer border border-solid flex justify-center items-center text-2xl"
            onClick={() => inputRef.current?.click()}
          >
            <AddIcon />
          </Box>
        )}
      </Box>
    );
  }
  if (type === 'textarea') {
    return (
      <Box>
        <FormLabel title={title} description={description} level={level} />
        <Box className="w-[88%]" mb={3}>
          <Textarea
            variant="outline"
            rows={8}
            value={value}
            whiteSpace="pre-wrap"
            wordBreak={'break-word'}
            onChange={(e) => onChange(e.target.value)}
          />
        </Box>
      </Box>
    );
  }
  if (type === 'json') {
    return (
      <Box>
        <FormLabel title={title} description={description} level={level} />
        <Box className="mt-4 mb-8 w-[88%]">
          <JsonEditor value={value} onChange={onChange} defaultHeight={250} resize />
        </Box>
      </Box>
    );
  }

  return <></>;
};

export default FormField;
