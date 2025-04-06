import { SystemStyleObject } from "@chakra-ui/react";

/**
 * Estilos padronizados para os carrosséis da aplicação
 * Inclui customizações para as setas, dots e outras partes do carrossel
 */
export const carouselStyles: SystemStyleObject = {
  ".slick-prev, .slick-next": {
    zIndex: 1,
    color: "white",
    "&:before": {
      fontSize: "24px"
    }
  },
  ".slick-prev": {
    left: "-10px"
  },
  ".slick-next": {
    right: "-10px"
  },
  ".slick-track": {
    display: "flex",
    paddingTop: "8px",
    paddingBottom: "8px"
  },
  ".slick-slide": {
    padding: "0 4px",
    "& > div": {
      height: "100%"
    }
  },
  ".slick-list": {
    margin: "0 -4px"
  },
  ".slick-dots": {
    bottom: "-30px",
    "li button:before": {
      color: "gray.600",
    },
    "li.slick-active button:before": {
      color: "primary.500",
    }
  }
};

/**
 * Estilos padronizados para carrosséis que exibem cards maiores (como listas)
 */
export const listCarouselStyles: SystemStyleObject = {
  ...carouselStyles,
  ".slick-track": {
    display: "flex",
    paddingTop: "8px",
    paddingBottom: "8px",
    minHeight: "320px"
  },
  ".slick-slide": {
    height: "inherit",
    padding: "0 8px",
    "& > div": {
      height: "100%",
      "& > div": {
        height: "100%",
        "& > div": {
          height: "100%"
        }
      }
    }
  },
  ".slick-list": {
    margin: "0 -8px"
  }
};

/**
 * Configurações padrão para carrosséis de séries
 */
export const seriesSliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 6,
  slidesToScroll: 3,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 2,
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 2,
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      }
    }
  ]
};

/**
 * Configurações padrão para carrosséis de listas
 */
export const listsSliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 2,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      }
    }
  ]
}; 