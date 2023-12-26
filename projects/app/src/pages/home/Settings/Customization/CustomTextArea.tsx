import { Textarea } from '@chakra-ui/react';
import { WidgetProps } from '@rjsf/utils';

const CustomTextarea: React.FC<WidgetProps> = (props) => {
  return (
    <div className="w-[88%]">
      <Textarea
        variant="none"
        className="border border-[#ced5e4] !rounded-sm focus:border-[#0f0c2b]"
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      />
    </div>
  );
};

export default CustomTextarea;
