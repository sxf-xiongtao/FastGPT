const TitleFieldTemplate: React.FC<any> = (props) => {
  const { title, id, required } = props;

  return (
    <a href={`#${title}`}>
      <span className="text-[18px] text-[#5283ff] py-[10px] font-semibold">{title}</span>
    </a>
  );
};

export default TitleFieldTemplate;
