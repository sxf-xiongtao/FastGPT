import { Box } from '@chakra-ui/react';
import MarkDownModal from '../MarkDownModal/MarkDownModal';

const Description: React.FC<any> = (props) => {
  const { description } = props;
  if (!description) {
    return <Box className="mt-2"></Box>;
  } else if ((description as string).length < 20) {
    return <Box className="mb-2 text-sm text-gray-400">{description}</Box>;
  } else {
    return (
      <MarkDownModal source={description as string}>
        <Box className="mb-2 text-sm text-gray-400 cursor-pointer w-20 hover:underline">
          {`查看详情 >>`}
        </Box>
      </MarkDownModal>
    );
  }
};

const FormLabel = ({
  title,
  description,
  level
}: {
  title: string;
  description: string;
  level: number;
}) => {
  return (
    <>
      <Box
        id={title}
        className={level === 2 ? 'text-xl text-blue-500 pt-2' : 'text-md h-full items-center flex'}
      >
        {title}
      </Box>
      <Description description={description} />
    </>
  );
};

export default FormLabel;
