import { Image } from '@chakra-ui/react';
import { WidgetProps } from '@rjsf/utils';
import { useRef } from 'react';
import { compressImgFileAndUpload } from '../../../../../service/admin/compressAndUpload';
import { AddIcon } from '@chakra-ui/icons';
import { useToast } from '@fastgpt/web/hooks/useToast';

const CustomImage: React.FC<WidgetProps> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  return (
    <div className="mt-4 mb-8">
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={async (event) => {
          if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const res = await compressImgFileAndUpload({ file });
            if (res) {
              props.onChange(res);
            } else {
              toast({
                title: '上传图片失败',
                status: 'error'
              });
            }
          }
        }}
      />
      {props.value ? (
        <Image
          src={props.value}
          alt="image"
          className="w-28 h-28 cursor-pointer border border-solid border-[#CED5E4]"
          onClick={() => inputRef.current?.click()}
          objectFit={'contain'}
        />
      ) : (
        <div
          className="w-28 h-28 cursor-pointer border border-solid flex justify-center items-center text-2xl"
          onClick={() => inputRef.current?.click()}
        >
          <AddIcon />
        </div>
      )}
    </div>
  );
};

export default CustomImage;
