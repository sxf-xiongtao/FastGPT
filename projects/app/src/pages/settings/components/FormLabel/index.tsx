import { Box, Flex, HStack } from '@chakra-ui/react';
import MarkDownModal from '../MarkDownModal/MarkDownModal';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';

const Description: React.FC<any> = ({ description }: { description?: string }) => {
  if (!description) {
    return null;
  } else {
    return (
      <MarkDownModal source={description}>
        <QuestionTip label={`${description}\n\n点击查看详情`} />
      </MarkDownModal>
    );
  }
};

const FormLabel = ({ title, description }: { title: string; description: string }) => {
  if (!title) return null;
  return (
    <HStack mb={2}>
      <Box id={title} color={'myGray.900'}>
        {title}
      </Box>
      <Description description={description} />
    </HStack>
  );
};

export default FormLabel;
