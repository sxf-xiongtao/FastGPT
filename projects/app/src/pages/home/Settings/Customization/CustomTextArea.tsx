import { Box, Textarea } from '@chakra-ui/react';
import { WidgetProps } from '@rjsf/utils';

const CustomTextarea: React.FC<WidgetProps> = (props) => {
  return (
    <Box className="w-[88%]" mb={3}>
      <Textarea
        variant="none"
        rows={8}
        className="border border-[#ced5e4] !rounded-sm focus:border-[#0f0c2b]"
        value={props.value}
        maxW={'100%'}
        whiteSpace="pre-wrap"
        wordBreak={'break-word'}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      />
    </Box>
  );
};

export default CustomTextarea;
