import {
  ComponentStyleConfig,
  createMultiStyleConfigHelpers,
  defineStyle,
  defineStyleConfig,
  extendTheme
} from '@chakra-ui/react';

const Button = defineStyleConfig({
  baseStyle: {},
  sizes: {},

  variants: {
    login: {
      bg: '#1997F0',
      color: 'white',
      width: '100%',
      height: '40px',
      borderRadius: '5px'
    },
    text: {
      bg: 'transparent',
      color: 'grayModern.500',
      _hover: {
        bg: 'transparent',
        color: 'grayModern.600'
      },
      _disabled: {
        bg: 'transparent',
        color: 'grayModern.500'
      }
    },
    confirm: {
      bg: 'myBlue.500',
      color: 'lafWhite.200',
      _hover: {
        bg: 'myBlue.600'
      },
      _disabled: {
        _hover: {
          bg: 'myBlue.500 !important'
        }
      }
    },
    outline: {
      bg: 'transparent',
      color: 'grayModern.500',
      border: '1px solid',
      borderColor: '#E5E5E5',
      fontWeight: '400',
      fontSize: '12px',
      borderRadius: '2px',
      px: 3,
      _hover: {
        bg: 'transparent',
        color: 'grayModern.600',
        borderColor: 'grayModern.300'
      },
      _disabled: {
        bg: 'transparent',
        color: 'grayModern.500',
        borderColor: 'grayModern.500'
      }
    },
    primary: {
      bg: 'myBlue.600',
      color: 'lafWhite.200',
      _hover: {
        bg: 'myBlue.700'
      },
      _disabled: {
        _hover: {
          bg: 'myBlue.500 !important'
        }
      }
    }
  }
});

const Modal = {
  defaultProps: {}
};

const Input: ComponentStyleConfig = {
  baseStyle: {
    field: {}
  },
  sizes: {
    xs: {
      field: {
        borderRadius: 'sm',
        fontSize: 'xs',
        height: 6,
        paddingX: 2
      }
    },
    sm: {
      field: {
        borderRadius: 'sm',
        fontSize: 'sm',
        height: 8,
        paddingX: 3
      }
    },
    md: {
      field: {
        borderRadius: 'md',
        fontSize: 'md',
        height: 10,
        paddingX: 4
      }
    },
    lg: {
      field: {
        borderRadius: 'md',
        fontSize: 'lg',
        height: 12,
        paddingX: 4
      }
    }
  },
  variants: {
    login: {
      field: {
        color: '#0D3C5C',
        borderRadius: '5px',
        border: '1px solid rgba(229, 229, 229, 1)',
        height: '48px',
        _focus: {
          borderBottom: '1px solid rgba(25, 151, 240, 1)'
        }
      }
    },
    pagination: {
      field: {
        borderRadius: 'sm',
        fontSize: 'sm',
        height: 8,
        paddingX: 3,
        border: '1px solid rgba(229, 229, 229, 1)',
        backgrond: '#000000',
        _hover: {
          borderColor: 'grayModern.300'
        },
        _focus: {
          boxShadow: 'none'
        }
      }
    },
    outline: {
      field: {
        borderBottom: '1px solid rgba(229, 229, 229, 1)',
        borderColor: 'transparent',
        borderRadius: '0px',
        _hover: {
          borderColor: 'transparent',
          borderBottom: '1px solid #3182ce'
        },
        _focus: {
          borderColor: 'transparent',
          borderBottom: '1px solid #3182ce',
          boxShadow: 'none'
        }
      }
    },
    search: {
      field: {
        borderRadius: 'sm',
        fontSize: 'sm',
        height: 8,
        paddingX: 3,
        border: '1px solid rgba(229, 229, 229, 1)',
        _hover: {
          borderColor: 'grayModern.300'
        },
        _focus: {
          boxShadow: 'none'
        }
      }
    },
    filled: {
      field: {
        background: 'lafWhite.600',
        border: '1px solid',
        borderColor: 'transparent',
        _hover: {
          background: 'lafWhite.600'
        },
        _focus: {
          background: 'transparent',
          borderColor: 'primary.400'
        }
      },
      addon: {
        background: 'lafWhite.600'
      }
    },
    unstyled: {
      field: {
        background: 'transparent',
        borderRadius: 'md',
        height: 'auto',
        paddingX: 0
      }
    }
  },
  defaultProps: {
    size: 'md',
    variant: 'filled'
  }
};

const Tabs = {
  variants: {
    'soft-rounded': {
      tab: {
        borderRadius: '4px',
        color: 'grayModern.500',
        _selected: {
          color: 'grayModern.900',
          bg: 'lafWhite.600',
          borderRadius: '4px'
        }
      }
    }
  }
};

const Table = {
  baseStyle: {},
  variants: {
    simple: {
      parts: ['th', 'td'],
      th: {
        border: 'none',
        fontWeight: '400',
        color: 'grayModern.500'
      },
      td: {
        border: 'none'
      }
    },
    border: {
      parts: ['th', 'td'],
      th: {
        borderWidth: 1,
        borderColor: 'grayModern.100',
        background: 'lafWhite.300'
      },
      td: {
        borderWidth: 1,
        borderColor: 'grayModern.100',
        background: 'lafWhite.300'
      }
    }
  },
  defaultProps: {
    variant: 'border'
  }
};

const Select = {
  variants: {
    filled: {
      field: {
        background: 'lafWhite.600',
        borderWidth: 1,
        _hover: {
          background: 'lafWhite.600'
        },
        _focusVisible: {
          background: 'lafWhite.200',
          borderColor: 'primary.400'
        }
      },
      icon: {
        color: 'grayIron.600'
      }
    }
  }
};

const Badge = {
  baseStyle: defineStyle({
    borderRadius: '50px',
    textTransform: 'none',
    fontWeight: 'medium',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  })
};

const Menu = {
  variants: {
    default: {
      list: {
        py: '4px',
        borderRadius: '4px',
        border: 'none',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
      },
      item: {
        minHeight: '36px'
      }
    }
  },
  defaultProps: {
    variant: 'default'
  }
};

const theme = extendTheme({
  useSystemColorMode: false,
  styles: {
    global: {
      'html, body': {
        color: 'myGray.900',
        fontSize: 'md',
        fontWeight: 400,
        height: '100%',
        overflow: 'hidden'
      }
    }
  },
  fontSizes: {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '16px',
    '2xl': '18px',
    '3xl': '20px'
  },
  colors: {
    primary: {
      100: '#E6F6F5',
      200: '#CCEEEB',
      300: '#99DDD8',
      400: '#66CBC4',
      500: '#33BAB1',
      600: '#00A99D',
      700: '#00877E',
      800: '#00655E',
      900: '#00443F',
      1000: '#00221F'
    },
    lafWhite: {
      100: '#FEFEFE',
      200: '#FDFDFE',
      300: '#FBFBFC',
      400: '#F8FAFB',
      500: '#F6F8F9',
      600: '#F4F6F8',
      700: '#C3C5C6',
      800: '#929495',
      900: '#626263',
      1000: '#313132'
    },
    myBlue: {
      100: '#f0f7ff',
      200: '#EBF7FD',
      300: '#d6e8ff',
      400: '#adceff',
      500: '#85b1ff',
      600: '#4e83fd',
      700: '#3370ff',
      800: '#2152d9',
      900: '#1237b3',
      1000: '#07228c'
    },
    grayModern: {
      100: '#EFF0F1',
      200: '#DEE0E2',
      300: '#BDC1C5',
      400: '#9CA2A8',
      500: '#7B838B',
      600: '#5A646E',
      700: '#485058',
      800: '#363C42',
      900: '#24282C',
      1000: '#121416'
    },
    grayIron: {
      100: '#F3F3F3',
      200: '#E6E6E7',
      300: '#CDCDD0',
      400: '#B4B4B8',
      500: '#9B9BA1',
      600: '#828289',
      700: '#68686E',
      800: '#4E4E52',
      900: '#343437',
      1000: '#1A1A1B'
    },
    error: {
      100: '#FDECEE',
      500: '#F16979',
      600: '#ED4458'
    },
    warn: {
      100: '#FFF2EC',
      400: '#FDB08A',
      600: '#FB7C3C',
      700: '#C96330'
    },
    rose: {
      100: '#FDEAF1'
    },
    blue: {
      100: '#EBF7FD',
      400: '#86CEF5',
      500: '#5EBDF2',
      600: '#36ADEF',
      700: '#2B8ABF'
    },
    purple: {
      300: '#DBBDE9',
      400: '#C99CDF',
      600: '#A55AC9',
      700: '#7167AA'
    },
    frostyNightfall: {
      200: '#EAEBF0'
    }
  },
  components: {
    Button,
    Modal,
    Input,
    Tabs,
    Table,
    Select,
    Badge,
    Menu
  }
});

export default theme;
