import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

// Configuração do modo de cor
const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

// Sistema de cores personalizado
const colors = {
  brand: {
    50: "#E6FFFA",
    100: "#B2F5EA",
    200: "#81E6D9",
    300: "#4FD1C5",
    400: "#38B2AC",
    500: "#319795", // primary
    600: "#2C7A7B", // secondary
    700: "#285E61",
    800: "#234E52",
    900: "#1D4044",
  },
  // Mantendo as cores padrão do Chakra e sobrescrevendo apenas o necessário
  gray: {
    50: "#F7FAFC",
    100: "#EDF2F7",
    200: "#E2E8F0",
    300: "#CBD5E0",
    400: "#A0AEC0",
    500: "#718096",
    600: "#4A5568",
    700: "#2D3748",
    800: "#1A202C",
    900: "#171923",
  },
};

// Estilos globais e tokens semânticos
const semanticTokens = {
  colors: {
    "chakra-body-bg": { _dark: "gray.900" },
    "chakra-body-text": { _dark: "#FFFFFF" },
    "chakra-placeholder-color": { _dark: "gray.400" },
    "chakra-border-color": { _dark: "gray.700" },
  },
};

const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "white",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
      variants: {
        solid: (props: any) => ({
          bg: `${props.colorScheme}.500`,
          color: "white",
          _hover: {
            bg: `${props.colorScheme}.600`,
            _disabled: {
              bg: `${props.colorScheme}.500`,
            },
          },
        }),
        ghost: {
          color: "white",
          _hover: {
            bg: "whiteAlpha.200",
          },
        },
        outline: {
          color: "white",
          borderColor: "gray.600",
          _hover: {
            bg: "whiteAlpha.200",
          },
        },
      },
    },
    Link: {
      baseStyle: {
        color: "white",
        _hover: {
          color: "brand.200",
          textDecoration: "none",
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "gray.700",
          borderColor: "gray.600",
          padding: "2",
          boxShadow: "lg",
          minW: "200px",
        },
        item: {
          bg: "gray.700 !important",
          color: "gray.100",
          _hover: {
            bg: "gray.600 !important",
          },
          _focus: {
            bg: "gray.600 !important",
          },
        },
        groupTitle: {
          color: "gray.400",
          fontWeight: "medium",
          fontSize: "sm",
          px: "3",
          py: "1",
        },
        divider: {
          my: "2",
          borderColor: "gray.600",
        },
        button: {
          bg: "gray.700",
          color: "gray.300",
          _hover: {
            bg: "gray.600",
          },
          _active: {
            bg: "gray.600",
          },
        },
      },
      defaultProps: {
        gutter: 0,
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "gray.800",
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: "gray.700",
        },
        header: {
          borderColor: "gray.600",
        },
        body: {
          bg: "gray.700",
        },
        footer: {
          borderColor: "gray.600",
        },
      },
    },
  },
});

export default theme;
