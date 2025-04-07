import React, { useState } from 'react';
import { Grid, Skeleton, useToast, Box } from '@chakra-ui/react';
import { ListCard } from './ListCard';
import { useQuery } from '@tanstack/react-query';
import { getPopularLists } from '../../services/lists';
import { ListWithUserData } from '../../types/list';
import { SectionBase } from '../common/SectionBase';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { listCarouselStyles, listsSliderSettings } from "../../styles/carouselStyles";

export function PopularLists() {
  const toast = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["popularLists"],
    queryFn: () => getPopularLists(12)
  });
  
  // Tipagem segura para os dados
  const lists: ListWithUserData[] = data || [];

  // Mostrar toast de erro se a query falhar
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar listas",
        description: "Não foi possível carregar as listas populares",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  // Componente de carregamento personalizado
  const loadingElement = (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} height="240px" borderRadius="lg" />
      ))}
    </Grid>
  );

  const renderContent = (limitItems: boolean) => {
    const displayedLists = limitItems ? lists.slice(0, 12) : lists;
    
    return (
      <Box sx={listCarouselStyles} pb={8}>
        <Slider {...listsSliderSettings}>
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
      title="Listas Populares"
      link="/lists"
      isLoading={isLoading}
      error={error as Error}
      isEmpty={lists.length === 0}
      emptyMessage="Ainda não há listas populares. Listas com mais de uma curtida aparecerão aqui!"
      loadingElement={loadingElement}
      expandable={lists.length > 6}
      renderContent={renderContent}
    />
  );
} 