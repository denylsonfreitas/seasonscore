import { extendTheme, ThemeConfig } from "@chakra-ui/react";

// Configuração para o modo de cor (claro/escuro)
const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

// Fontes
const fonts = {
  heading: "'Inter', sans-serif",
  body: "'Inter', sans-serif",
  logo: "'DM Serif Display', serif", // Fonte específica para o logo
};

// Sombras personalizadas
const shadows = {
  outline: "0 0 0 3px var(--primary-200)",
  sm: "0 2px 8px rgba(0, 0, 0, 0.1)",
  md: "0 4px 12px rgba(0, 0, 0, 0.15)",
  lg: "0 8px 20px rgba(0, 0, 0, 0.2)",
  xl: "0 12px 28px rgba(0, 0, 0, 0.25)",
};

// Sistema de cores centralizado
const colors = {
  primary: {
    50: "#e0f7f0",
    100: "#b3eadb",
    200: "#84ddc4",
    300: "#54cfad",
    400: "#2ec59b",
    500: "#04a777", // Cor principal definida pelo usuário
    600: "#039b6d",
    700: "#028a60",
    800: "#017853",
    900: "#005b3f",
  },
  secondary: {
    50: "#f7fafc",
    100: "#edf2f7",
    200: "#e2e8f0",
    300: "#cbd5e0",
    400: "#a0aec0",
    500: "#718096",
    600: "#4a5568",
    700: "#2d3748",
    800: "#1a202c",
    900: "#171923",
  },
 
  reactions: {
    like: "#FF101F",
    dislike: "#800020",
  },

  followbutton: {
    follow: "#04a777",
    unfollow: "#FF0000",
  },

  linkhome: {
    series: "#38A169",
    popular: "#4299E1",
    recent: "#9F7AEA",
    top10: "#F6AD55",
  },
 
  success: "#38A169",
  warning: "#ECC94B",
  error: "#E53E3E",
  info: "#3182CE",
};

// Bordas arredondadas
const radii = {
  none: "0",
  sm: "5px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  "3xl": "32px",
  full: "9999px",
};

const styles = {
  global: {
    // Estilos globais para todo o app
    "html, body": {
      padding: 0,
      margin: 0,
      background: "gray.900",
      color: "white",
      overflowX: "hidden",
      width: "100%",
      height: "100%",
      position: "relative",
      lineHeight: "tall",
    },
    // Quando um modal está aberto
    "body.chakra-modal-open": {
      overflow: "hidden",
      paddingRight: "0 !important", // Impede o padding que o Chakra adiciona
    },
    "body.chakra-ui-light": {
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      "::-webkit-scrollbar": {
        display: "none",
      },
    },
    // Estilo de texto padrão
    "h1, h2, h3, h4, h5, h6": {
      fontWeight: "700",
      letterSpacing: "-0.01em",
    },
    "p, span, a, button, input, textarea": {
      letterSpacing: "0.01em",
    },
  },
};

// Definindo o tema estendido
const theme = extendTheme({
  colors,
  fonts,
  radii,
  shadows,
  config,
  styles,
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "full",
        _focus: {
          boxShadow: "0 0 0 3px var(--primary-300)",
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "full",
        },
      },
      variants: {
        outline: {
          field: {
            _focus: {
              borderColor: "primary.400",
              boxShadow: "0 0 0 1px var(--primary-400)",
            },
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "xl",
        },
      },
    },
    Modal: {
      // Configuração para evitar o deslocamento quando modais são abertos
      baseStyle: {
        overlay: {
          backdropFilter: "blur(5px)",
          bg: "blackAlpha.700",
        },
        dialog: {
          my: "auto",
          mx: "auto",
          boxShadow: "xl",
          borderRadius: "xl",
        },
        dialogContainer: {
          // Isso ajuda a centralizar sem deslocar o conteúdo
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    Drawer: {
      // Configuração para drawers
      baseStyle: {
        overlay: {
          backdropFilter: "blur(5px)",
        },
        dialog: {
          borderRadius: "xl",
        },
      },
    },
    Popover: {
      // Configuração para popovers
      baseStyle: {
        popper: {
          zIndex: 1500,
          width: "auto",
          maxWidth: "100vw"
        },
        content: {
          boxShadow: "lg",
          borderRadius: "xl",
          _focus: { boxShadow: "lg", outline: "none" },
          '& > .chakra-popover__close-btn': {
            display: 'none !important',
          }
        },
        body: {
          padding: "0",
        },
        arrow: {
          boxShadow: "none",
        },
        closeButton: {
          display: "none !important",
          visibility: "hidden",
          opacity: 0,
          position: "absolute",
          pointerEvents: "none"
        }
      }
    },
  },
});

export default theme; 