import { Box, HStack, StackProps } from '@chakra-ui/react';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import MarkDownModal from '../MarkDownModal/MarkDownModal';

export const Description: React.FC<any> = ({ description }: { description?: string }) => {
  if (!description) {
    return null;
  } else {
    return (
      <MarkDownModal source={description}>
        <QuestionTip
          display={'flex'}
          alignItems={'center'}
          label={`${description}\n\n点击查看详情`}
          cursor={'pointer'}
        />
      </MarkDownModal>
    );
  }
};
const FormLabel = ({
  title,
  description,
  ...props
}: { title: string; description?: string } & StackProps) => {
  if (!title) return null;
  return (
    <HStack {...props}>
      <Box id={title} color={'myGray.900'}>
        {title}
      </Box>
      <Description description={description} />
    </HStack>
  );
};

export default FormLabel;
