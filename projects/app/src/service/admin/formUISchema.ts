import CustomImage from '../../pages/home/Settings/Customization/CustomImage';

export const uiSchema = {
  'ui:widget': CustomImage,
  fastgpt: {
    FeConfig: {
      favicon: {
        'ui:widget': CustomImage
      },
      avatar: {
        'ui:widget': CustomImage
      }
    }
  }
};
