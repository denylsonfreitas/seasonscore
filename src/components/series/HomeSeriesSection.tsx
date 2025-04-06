import {
  Spinner,
  Text,
  Box,
} from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { SeriesResponse } from "../../services/tmdb";
import { useQuery } from "@tanstack/react-query";
import { getSeriesReviews } from "../../services/reviews";
import { SectionBase } from "../common/SectionBase";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface HomeSectionProps {
  title: string;
  queryKey: string[];
  queryFn: () => Promise<SeriesResponse>;
  link?: string;
}

export function HomeSeriesSection({
  title,
  queryKey,
  queryFn,
  link,
}: HomeSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar as avaliações para cada série
  const { data: allReviews = {} } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      if (!data?.results) return {};
      
      const reviewsMap: { [key: number]: number } = {};
      
      await Promise.all(
        data.results.map(async (series) => {
          try {
            const reviews = await getSeriesReviews(series.id);
            if (reviews.length > 0) {
              // Calcular a média das avaliações
              const allRatings = reviews.flatMap(review => 
                review.seasonReviews.map(sr => sr.rating)
              );
              
              if (allRatings.length > 0) {
                reviewsMap[series.id] = 
                  allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
              }
            }
          } catch (error) {
          }
        })
      );
      
      return reviewsMap;
    },
    enabled: !!data?.results,
  });
  
  const sliderSettings = {
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
  
  const renderContent = () => {
    return (
      <Box 
        sx={{
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
            bottom: "-30px"
          }
        }}
        pb={8}
      >
        <Slider {...sliderSettings}>
          {data?.results?.map((series) => (
            <Box key={series.id}>
              <SeriesCard 
                key={series.id} 
                series={{
                  ...series,
                  rating: allReviews[series.id]
                }}
              />
            </Box>
          ))}
        </Slider>
      </Box>
    );
  };

  // Componentes de estados personalizados
  const loadingElement = (
    <Box textAlign="center" py={8}>
      <Spinner size="xl" color="primary.500" />
    </Box>
  );

  const errorElement = (
    <Box textAlign="center" py={8}>
      <Text color="red.500">Erro ao carregar séries</Text>
    </Box>
  );

  return (
    <SectionBase
      title={title}
      link={link}
      isLoading={isLoading}
      error={error as Error}
      isEmpty={!data?.results?.length}
      loadingElement={loadingElement}
      errorElement={errorElement}
      renderContent={() => renderContent()}
      containerProps={{ mb: 12 }}
    />
  );
}
