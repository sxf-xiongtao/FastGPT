import CustomImage from '../../pages/home/Settings/Customization/CustomImage';

export const uiSchema = {
  'ui:widget': CustomImage,
  FeConfig: {
    favicon: {
      'ui:widget': CustomImage
    },
    avatar: {
      'ui:widget': CustomImage
    }
  }
};
