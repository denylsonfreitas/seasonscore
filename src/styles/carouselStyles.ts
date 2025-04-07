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
    display: "none"
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
 * Estilos específicos para o carrossel de elenco
 * Adaptados para cards menores e com foco na exibição de fotos
 */
export const castCarouselStyles: SystemStyleObject = {
  
  ...carouselStyles,
  ".slick-track": {
    display: "flex",
    paddingTop: "8px",
    paddingBottom: "8px",
    minHeight: "180px"
  },
  ".slick-slide": {
    height: "inherit",
    padding: "0 6px",
    "& > div": {
      height: "100%"
    }
  },
  ".slick-prev": {
    left: "-15px",
    "&:before": {
      fontSize: "28px"
    }
  },
  ".slick-next": {
    right: "-15px",
    "&:before": {
      fontSize: "28px"
    }
  }
};

/**
 * Configurações padrão para carrosséis de séries
 */
export const seriesSliderSettings = {
  dots: false,
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
        dots: false
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 2,
        dots: false
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        dots: false
      }
    }
  ]
};

/**
 * Configurações padrão para carrosséis de listas
 */
export const listsSliderSettings = {
  dots: false,
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
        dots: false
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false
      }
    }
  ]
};

/**
 * Configurações padrão para carrosséis de elenco
 */
export const castSliderSettings = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 5,
  slidesToScroll: 3,
  autoplay: false,
  pauseOnHover: true,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 2,
        dots: false
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 2,
        dots: false
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        dots: false
      }
    }
  ]
}; 