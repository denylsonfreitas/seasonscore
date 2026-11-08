import React, { useState } from "react";
import { Box, Text, Grid, Flex } from "@chakra-ui/react";
import { TelevisionSimple } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import {
  getPopularReviews,
  getRecentFollowedUsersReviews,
  PopularReview,
  getAllReviews,
} from "../services/reviews";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/common/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/common/EmptyState";
import { ReviewCard, ReviewCardSkeleton } from "../components/reviews/ReviewCard";

export function Reviews() {
  const { currentUser } = useAuth();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar avaliações populares (com pelo menos 1 curtida)
  const { data: popularReviews = [], isLoading: isLoadingPopular } = useQuery({
    queryKey: ["allPopularReviews"],
    queryFn: () => getPopularReviews(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Buscar todas as avaliações
  const { data: allReviews = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["allReviews"],
    queryFn: () => getAllReviews(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Buscar avaliações de usuários seguidos
  const { data: followedReviews = [], isLoading: isLoadingFollowed } = useQuery({
    queryKey: ["allFollowedReviews"],
    queryFn: () => getRecentFollowedUsersReviews(30),
    enabled: !!currentUser,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Filtrar avaliações com base na busca
  const filteredPopularReviews = popularReviews.filter(
    (review) =>
      searchQuery === "" ||
      review.seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllReviews = allReviews.filter(
    (review: PopularReview) =>
      searchQuery === "" ||
      review.seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowedReviews = followedReviews.filter(
    (review) =>
      searchQuery === "" ||
      review.seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manipuladores de eventos
  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Poderia adicionar lógica adicional aqui se necessário
    }
  };

  // Renderizar um card de avaliação
  const renderReviewCard = (review: PopularReview) => (
    <ReviewCard key={`${review.id}-${review.seasonNumber}`} review={review} />
  );

  // Renderizar o grid de skeleton cards para o estado de carregamento
  const renderSkeletonGrid = () => (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
      {Array.from({ length: 6 }, (_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </Grid>
  );

  return (
    <Flex direction="column">
      <PageHeader
        title="Avaliações"
        subtitle="Descubra o que a comunidade está assistindo e avaliando"
        tabs={[
          {
            label: "Populares",
            isSelected: activeTabIndex === 0,
            onClick: () => handleTabChange(0),
          },
          {
            label: "Seguindo",
            isSelected: activeTabIndex === 1,
            onClick: () => handleTabChange(1),
          },
          {
            label: "Todas",
            isSelected: activeTabIndex === 2,
            onClick: () => handleTabChange(2),
          },
        ]}
        showSearch={true}
        searchPlaceholder="Buscar por série ou usuário..."
        onSearch={setSearchQuery}
        onSearchSubmit={handleSearch}
        searchValue={searchQuery}
      />

      <PageContainer flex="1" py={8}>
        {activeTabIndex === 0 ? (
          isLoadingPopular ? (
            renderSkeletonGrid()
          ) : filteredPopularReviews.length > 0 ? (
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
              gap={4}
            >
              {filteredPopularReviews.map(renderReviewCard)}
            </Grid>
          ) : (
            <EmptyState
              icon={TelevisionSimple}
              title="Nenhuma avaliação curtida ainda."
              description="Curta as avaliações que você concorda para elas aparecerem aqui."
            />
          )
        ) : activeTabIndex === 1 ? (
          // Conteúdo da aba "Seguindo"
          !currentUser ? (
            <EmptyState
              icon={TelevisionSimple}
              title="Entre para ver as avaliações de quem você segue."
            />
          ) : isLoadingFollowed ? (
            renderSkeletonGrid()
          ) : filteredFollowedReviews.length > 0 ? (
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
              gap={4}
            >
              {filteredFollowedReviews.map(renderReviewCard)}
            </Grid>
          ) : (
            <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
              <Text color="gray.400">Você ainda não tem avaliações de usuários seguidos</Text>
            </Box>
          )
        ) : // Conteúdo da aba "Todas"
        isLoadingAll ? (
          renderSkeletonGrid()
        ) : filteredAllReviews.length > 0 ? (
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
            gap={4}
          >
            {filteredAllReviews.map(renderReviewCard)}
          </Grid>
        ) : (
          <EmptyState icon={TelevisionSimple} title="Nenhuma avaliação encontrada." />
        )}
      </PageContainer>
    </Flex>
  );
}
