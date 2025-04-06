import React from 'react';
import {
  Grid,
  Skeleton,
  useToast,
  Box,
  Text
} from '@chakra-ui/react';
import { ListCard } from './ListCard';
import { useQuery } from '@tanstack/react-query';
import { getFollowedUsersLists } from '../../services/lists';
import { ListWithUserData } from '../../types/list';
import { useAuth } from '../../contexts/AuthContext';
import { SectionBase } from '../common/SectionBase';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export function FollowedUsersLists() {
  const toast = useToast();
  const { currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["followedUsersLists"],
    queryFn: () => getFollowedUsersLists(12),
    enabled: !!currentUser,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Tipagem segura para os dados
  const lists: ListWithUserData[] = data || [];

  // Mostrar toast de erro se a query falhar
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar listas",
        description: "Não foi possível carregar as listas de usuários seguidos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  // Elementos personalizados para estados
  const loadingElement = (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} height="240px" borderRadius="lg" />
      ))}
    </Grid>
  );

  // Componente para mensagem quando o usuário não está logado ou não tem listas
  const emptyElement = !currentUser ? (
    <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
      <Text color="gray.400">
        Faça login para ver listas de usuários que você segue.
      </Text>
    </Box>
  ) : (
    <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
      <Text color="gray.400">
        Você ainda não tem listas de usuários seguidos. Comece a seguir usuários para ver suas listas aqui.
      </Text>
    </Box>
  );

  // Renderização do conteúdo
  const renderContent = (limitItems: boolean) => {
    const displayedLists = limitItems ? lists.slice(0, 12) : lists;
    
    const sliderSettings = {
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
        }}
        pb={8}
      >
        <Slider {...sliderSettings}>
          {displayedLists.map((list) => (
            <Box key={list.id} height="100%" px="1px">
              <ListCard key={list.id} list={list} />
            </Box>
          ))}
        </Slider>
      </Box>
    );
  };

  return (
    <SectionBase
      title="Listas de quem você segue"
      link="/lists"
      isLoading={isLoading}
      error={error as Error}
      isEmpty={!currentUser || lists.length === 0}
      emptyElement={emptyElement}
      loadingElement={loadingElement}
      expandable={lists.length > 6}
      renderContent={renderContent}
    />
  );
} 