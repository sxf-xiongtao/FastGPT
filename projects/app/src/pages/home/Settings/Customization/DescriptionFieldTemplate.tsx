import MarkDownModal from '../MarkDownModal/MarkDownModal';

const DescriptionFieldTemplate: React.FC<any> = (props) => {
  const { description } = props;
  if (!description) {
    return <div className="mt-2"></div>;
  } else if ((description as string).length < 20) {
    return <div className="mb-2 text-sm text-gray-400">{description}</div>;
  } else {
    return (
      <MarkDownModal source={description as string}>
        <div className="mb-2 text-sm text-gray-400 cursor-pointer w-20 hover:underline">
          {`查看详情 >>`}
        </div>
      </MarkDownModal>
    );
  }
};

export default DescriptionFieldTemplate;
