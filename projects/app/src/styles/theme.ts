import { ComponentStyleConfig, defineStyleConfig, extendTheme } from '@chakra-ui/react';

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
      },
      a: {
        color: 'myBlue.700'
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
    }
  },
  components: {
    Button,
    Modal,
    Input
  }
});

export default theme;
