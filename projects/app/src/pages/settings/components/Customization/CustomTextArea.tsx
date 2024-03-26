import { Box, Textarea } from '@chakra-ui/react';
import { WidgetProps } from '@rjsf/utils';

const CustomTextarea: React.FC<WidgetProps> = (props) => {
  return (
    <Box className="w-[88%]" mb={3}>
      <Textarea
        variant="outline"
        rows={8}
        value={props.value}
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
