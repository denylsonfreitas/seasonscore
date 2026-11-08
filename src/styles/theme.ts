import { extendTheme, type StyleFunctionProps, type ThemeConfig } from "@chakra-ui/react";
import { fontFamilies } from "./fonts";

// Design system do SeasonScore. Valores definidos em DESIGN.md.

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

/** Neutros quentes ("tela apagada"). */
const ink = {
  50: "#F7F6F2",
  100: "#EDEBE5",
  200: "#D6D3CB",
  300: "#A8A59C",
  400: "#7A776F",
  600: "#46443F",
  700: "#34332F",
  800: "#282825",
  850: "#1F1F1C",
  900: "#171715",
  950: "#0F0F0E",
};

/** Verde de sinal: ação, foco e estado ativo. */
const signal = {
  50: "#E6FAF2",
  100: "#C2F2DE",
  200: "#8EE6C3",
  300: "#57D6A4",
  400: "#26C287",
  500: "#0BAA74",
  600: "#078C60",
  700: "#066E4C",
  800: "#065239",
  900: "#053B2A",
};

const colors = {
  ink,
  signal,
  // "primary" e "gray" são usados em todo o código: apontam para a nova paleta
  primary: signal,
  gray: {
    50: ink[50],
    100: ink[100],
    200: ink[200],
    300: "#BDBAB1",
    400: ink[300],
    500: ink[400],
    600: ink[600],
    700: ink[800],
    800: ink[900],
    900: ink[950],
  },
  score: {
    low: "#E5534B",
    mid: "#E0A43B",
    high: "#2BC48A",
  },
  star: "#F2B53D",
  danger: "#E5534B",
  warning: "#E0A43B",
  info: "#6CA6E8",
  success: signal[400],
  reactions: {
    like: "#E5534B",
    dislike: "#8B2B2B",
  },
  notifications: {
    newfollower: ink[300],
    newcomment: signal[400],
    newlike: "#E5534B",
    newepisode: signal[400],
    newreview: "#F2B53D",
  },
};

const fonts = {
  heading: fontFamilies.display,
  body: fontFamilies.body,
  mono: fontFamilies.mono,
  logo: fontFamilies.display,
};

const fontSizes = {
  "2xs": "0.6875rem", // 11
  xs: "0.75rem", // 12
  sm: "0.8125rem", // 13
  md: "0.9375rem", // 15
  lg: "1.0625rem", // 17
  xl: "1.375rem", // 22
  "2xl": "1.75rem", // 28
  "3xl": "2.25rem", // 36
  "4xl": "3rem", // 48
  "5xl": "3.5rem",
  "6xl": "4rem",
};

const radii = {
  none: "0",
  xs: "2px",
  sm: "4px",
  base: "4px",
  md: "6px",
  lg: "8px",
  xl: "8px",
  "2xl": "10px",
  "3xl": "12px",
  full: "9999px",
};

const shadows = {
  xs: "none",
  sm: "none",
  base: "none",
  md: "0 4px 12px rgba(0, 0, 0, 0.35)",
  lg: "0 12px 32px rgba(0, 0, 0, 0.5)",
  xl: "0 12px 32px rgba(0, 0, 0, 0.5)",
  "2xl": "0 16px 40px rgba(0, 0, 0, 0.55)",
  "dark-lg": "0 12px 32px rgba(0, 0, 0, 0.5)",
  outline: `0 0 0 2px ${signal[400]}`,
  poster: "inset 0 0 0 1px rgba(255, 255, 255, 0.06)",
};

const textStyles = {
  display: {
    fontFamily: "heading",
    fontWeight: 800,
    fontStretch: "108%",
    fontSize: ["2.125rem", "3rem"],
    lineHeight: ["2.375rem", "3.125rem"],
    letterSpacing: "-0.02em",
  },
  h1: {
    fontFamily: "heading",
    fontWeight: 800,
    fontStretch: "106%",
    fontSize: ["1.75rem", "2.25rem"],
    lineHeight: ["2rem", "2.5rem"],
    letterSpacing: "-0.02em",
  },
  h2: {
    fontFamily: "heading",
    fontWeight: 700,
    fontStretch: "104%",
    fontSize: "1.375rem",
    lineHeight: "1.75rem",
    letterSpacing: "-0.015em",
  },
  h3: {
    fontFamily: "heading",
    fontWeight: 700,
    fontStretch: "100%",
    fontSize: "1.0625rem",
    lineHeight: "1.375rem",
    letterSpacing: "-0.01em",
  },
  bodyLg: { fontSize: "lg", lineHeight: "1.75rem" },
  label: {
    fontFamily: "mono",
    fontWeight: 500,
    fontSize: "2xs",
    lineHeight: "1rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  score: {
    fontFamily: "mono",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
};

const styles = {
  global: {
    html: {
      background: ink[950],
      scrollBehavior: "smooth",
    },
    body: {
      background: ink[950],
      color: ink[100],
      fontFamily: "body",
      fontSize: "md",
      lineHeight: "1.6",
      // "clip" corta o excesso sem transformar o body em área de rolagem
      overflowX: "clip",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      textRendering: "optimizeLegibility",
    },
    "::selection": {
      background: signal[700],
      color: ink[50],
    },
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "heading",
    },
    ":focus-visible": {
      outline: `2px solid ${signal[400]}`,
      outlineOffset: "2px",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animationDuration: "0.01ms !important",
        transitionDuration: "0.01ms !important",
        scrollBehavior: "auto !important",
      },
    },
  },
};

const transition = "all 120ms cubic-bezier(0.2, 0, 0, 1)";

const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  radii,
  shadows,
  textStyles,
  styles,
  components: {
    Heading: {
      baseStyle: {
        fontFamily: "heading",
        fontWeight: 800,
        fontStretch: "105%",
        letterSpacing: "-0.02em",
        color: "ink.50",
      },
      sizes: {
        "2xl": { fontSize: ["2.125rem", "3rem"], lineHeight: 1.05 },
        xl: { fontSize: ["1.75rem", "2.25rem"], lineHeight: 1.1 },
        lg: { fontSize: ["1.5rem", "1.75rem"], lineHeight: 1.15 },
        md: { fontSize: "1.375rem", lineHeight: 1.25, fontWeight: 700 },
        sm: { fontSize: "1.0625rem", lineHeight: 1.3, fontWeight: 700, fontStretch: "100%" },
        xs: { fontSize: "0.9375rem", lineHeight: 1.3, fontWeight: 700, fontStretch: "100%" },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: 600,
        borderRadius: "sm",
        transition,
        _focusVisible: { boxShadow: "outline" },
      },
      sizes: {
        lg: { h: 12, fontSize: "md", px: 6 },
        md: { h: 10, fontSize: "md", px: 4 },
        sm: { h: 8, fontSize: "sm", px: 3 },
        xs: { h: 6, fontSize: "xs", px: 2 },
      },
      variants: {
        solid: (props: StyleFunctionProps) =>
          props.colorScheme === "primary"
            ? {
                bg: "signal.500",
                color: "ink.950",
                _hover: { bg: "signal.400", _disabled: { bg: "signal.500" } },
                _active: { bg: "signal.600" },
              }
            : {},
        outline: (props: StyleFunctionProps) =>
          props.colorScheme === "primary"
            ? {
                borderColor: "ink.600",
                color: "ink.100",
                bg: "transparent",
                _hover: { bg: "ink.850", borderColor: "ink.400" },
                _active: { bg: "ink.800" },
              }
            : {},
        ghost: (props: StyleFunctionProps) =>
          props.colorScheme === "primary"
            ? {
                color: "ink.300",
                _hover: { bg: "ink.850", color: "ink.50" },
                _active: { bg: "ink.800" },
              }
            : {},
        link: { color: "signal.300", fontWeight: 500 },
      },
      defaultProps: {
        colorScheme: "primary",
        variant: "solid",
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: "ink.850",
            borderColor: "ink.700",
            borderRadius: "sm",
            color: "ink.100",
            _placeholder: { color: "ink.400" },
            _hover: { borderColor: "ink.600" },
            _focusVisible: { borderColor: "signal.400", boxShadow: "none" },
          },
        },
        filled: {
          field: {
            bg: "ink.850",
            borderRadius: "sm",
            _hover: { bg: "ink.800" },
            _focusVisible: { bg: "ink.850", borderColor: "signal.400" },
          },
        },
      },
      defaultProps: { focusBorderColor: "signal.400" },
    },
    Textarea: {
      variants: {
        outline: {
          bg: "ink.850",
          borderColor: "ink.700",
          borderRadius: "sm",
          _placeholder: { color: "ink.400" },
          _focusVisible: { borderColor: "signal.400", boxShadow: "none" },
        },
      },
      defaultProps: { focusBorderColor: "signal.400" },
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: "ink.850",
            borderColor: "ink.700",
            borderRadius: "sm",
            _focusVisible: { borderColor: "signal.400", boxShadow: "none" },
          },
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tablist: { borderBottom: "1px solid", borderColor: "ink.700" },
          tab: {
            color: "ink.300",
            fontWeight: 500,
            borderBottom: "2px solid",
            borderColor: "transparent",
            mb: "-1px",
            _selected: { color: "ink.50", borderColor: "signal.400" },
            _hover: { color: "ink.100" },
          },
        },
      },
      defaultProps: { colorScheme: "primary" },
    },
    Modal: {
      baseStyle: {
        overlay: { bg: "rgba(8, 8, 7, 0.75)" },
        dialog: {
          bg: "ink.900",
          border: "1px solid",
          borderColor: "ink.700",
          borderRadius: "lg",
          boxShadow: "lg",
          mx: 4,
        },
        header: { fontFamily: "heading", fontStretch: "105%", fontWeight: 700 },
        closeButton: { borderRadius: "sm" },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { bg: "ink.900" },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "ink.850",
          border: "1px solid",
          borderColor: "ink.700",
          borderRadius: "lg",
          boxShadow: "lg",
          py: 1,
        },
        item: {
          bg: "transparent",
          minH: 9,
          _hover: { bg: "ink.800" },
          _focus: { bg: "ink.800" },
        },
        divider: { borderColor: "ink.700" },
      },
    },
    Popover: {
      baseStyle: {
        popper: { zIndex: 1500, width: "auto", maxWidth: "100vw" },
        content: {
          bg: "ink.850",
          borderColor: "ink.700",
          borderRadius: "lg",
          boxShadow: "lg",
          _focus: { outline: "none" },
        },
        body: { padding: "0" },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: "ink.800",
        color: "ink.100",
        borderRadius: "sm",
        fontSize: "sm",
        px: 2,
        py: 1,
      },
    },
    Badge: {
      baseStyle: {
        fontFamily: "mono",
        fontWeight: 500,
        letterSpacing: "0.04em",
        borderRadius: "xs",
        textTransform: "none",
      },
      variants: {
        solid: { bg: "signal.500", color: "ink.950" },
        subtle: { bg: "ink.850", color: "ink.300" },
        rating: { bg: "ink.850", color: "star" },
      },
      defaultProps: { variant: "subtle" },
    },
    Tag: {
      baseStyle: {
        container: { borderRadius: "sm", fontWeight: 500 },
      },
    },
    Divider: {
      baseStyle: { borderColor: "ink.700", opacity: 1 },
    },
    Skeleton: {
      baseStyle: {
        borderRadius: "md",
      },
      defaultProps: {},
    },
    Card: {
      baseStyle: {
        container: {
          bg: "ink.900",
          border: "1px solid",
          borderColor: "ink.700",
          borderRadius: "md",
          boxShadow: "none",
        },
      },
    },
    Link: {
      baseStyle: {
        transition,
        _hover: { textDecoration: "none", color: "ink.50" },
      },
    },
  },
});

export default theme;
