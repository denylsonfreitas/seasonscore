import {
  Box,
  Container,
  Text,
  VStack,
  Flex,
  useToast,
  useDisclosure,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../config/firebase";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "../components/common/Footer";
import { getUserReviews, SeriesReview } from "../services/reviews";
import { getUserWatchlist } from "../services/watchlist";
import { getFollowers, getFollowing } from "../services/followers";
import {
  getUserData,
  UserData,
  createOrUpdateUser,
  getUserByUsername,
} from "../services/users";
import { getUserLists } from "../services/lists";
import { UserListModal } from "../components/user/UserListModal";
import { ExtendedUser } from "../types/auth";
import { ReviewDetailsModal } from "../components/reviews/ReviewDetailsModal";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";

// Componentes modularizados para perfil
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStats } from "../components/profile/ProfileStats";
import { ReviewsSection } from "../components/profile/ReviewsSection";
import { WatchlistSection } from "../components/profile/WatchlistSection";
import { ListsSection } from "../components/profile/ListsSection";

// Função para adaptar a avaliação para o formato esperado pelo ReviewDetailsModal
const adaptReviewForDetails = (review: SeriesReview): any => {
  if (!review) return null;
  
  // Verificar se há uma temporada específica selecionada
  const seasonNumber = review.selectedSeasonNumber || review.seasonReviews[0].seasonNumber;
  
  // Encontrar a avaliação da temporada selecionada
  const selectedSeasonReview = review.seasonReviews.find(
    sr => sr.seasonNumber === seasonNumber
  ) || review.seasonReviews[0];
  
  return {
    id: review.id,
    seriesId: review.seriesId.toString(),
    userId: review.userId,
    userEmail: review.userEmail,
    seriesName: review.series.name,
    seriesPoster: review.series.poster_path,
    seasonNumber: selectedSeasonReview.seasonNumber,
    rating: selectedSeasonReview.rating,
    comment: selectedSeasonReview.comment || "",
    comments: selectedSeasonReview.comments || [],
    reactions: selectedSeasonReview.reactions || { likes: [] },
    createdAt: selectedSeasonReview.createdAt || new Date()
  };
};

export function Profile() {
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const { username } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedReviewForDetails, setSelectedReviewForDetails] = useState<SeriesReview | null>(null);
  const [isReviewDetailsOpen, setIsReviewDetailsOpen] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showLists, setShowLists] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile =
    !username || (currentUser && profileUser?.id === currentUser.uid);
  const targetUserId = profileUser?.id || currentUser?.uid;

  // Efeito para buscar o usuário do perfil
  useEffect(() => {
    const fetchProfileUser = async () => {
      if (username) {
        const userData = await getUserByUsername(username);
        if (userData) {
          setProfileUser(userData);
        } else {
          toast({
            title: "Usuário não encontrado",
            description: "O usuário que você procura não existe.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          // Redirecionar para a página 404 quando o usuário não for encontrado
          navigate("/404", { replace: true });
        }
      } else if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        setProfileUser(userData);
      }
    };
    fetchProfileUser();
  }, [username, currentUser, navigate, toast]);

  // Consultas para dados do perfil
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["userReviews", targetUserId],
    queryFn: () => getUserReviews(targetUserId!),
    enabled: !!targetUserId,
    refetchInterval: 5000,
    staleTime: 0
  });

  const { data: watchlist = [], isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ["userWatchlist", targetUserId],
    queryFn: () => getUserWatchlist(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: followers = [], isLoading: isLoadingFollowers } = useQuery({
    queryKey: ["followers", targetUserId],
    queryFn: () => getFollowers(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: following = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ["following", targetUserId],
    queryFn: () => getFollowing(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: userLists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: ['userLists', targetUserId],
    queryFn: () => getUserLists(targetUserId || ''),
    enabled: !!targetUserId
  });

  // Usar useEffect para manter a avaliação selecionada atualizada quando os dados forem buscados novamente
  useEffect(() => {
    if (selectedReviewForDetails && reviews.length > 0) {
      // Encontrar a avaliação atualizada pelo ID
      const updatedReview = reviews.find(r => r.id === selectedReviewForDetails.id);
      if (updatedReview) {
        // Apenas atualizar se houver diferenças nas temporadas (como reações ou comentários)
        const selectedSeasonNumber = selectedReviewForDetails.selectedSeasonNumber;
        const currentSeasonInSelected = selectedReviewForDetails.seasonReviews.find(
          sr => sr.seasonNumber === selectedSeasonNumber
        );
        const currentSeasonInUpdated = updatedReview.seasonReviews.find(
          sr => sr.seasonNumber === selectedSeasonNumber
        );
        
        // Verificar se há diferenças nas reações ou comentários antes de atualizar
        if (currentSeasonInSelected && currentSeasonInUpdated && (
          JSON.stringify(currentSeasonInSelected.reactions) !== JSON.stringify(currentSeasonInUpdated.reactions) ||
          JSON.stringify(currentSeasonInSelected.comments) !== JSON.stringify(currentSeasonInUpdated.comments)
        )) {
          // Manter o número da temporada selecionada
          setSelectedReviewForDetails({
            ...updatedReview,
            selectedSeasonNumber
          });
        }
      }
    }
  }, [reviews]); // Remover selectedReviewForDetails das dependências

  // Manipuladores de eventos
  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        displayName,
      });

      await updateProfile(currentUser, {
        displayName,
      });

      await createOrUpdateUser(currentUser);

      toast({
        title: "Perfil atualizado",
        description: "Seu nome foi atualizado com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar seu nome. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingPhoto(true);
    try {
      const file = event.target.files[0];
      const photoURL = await uploadProfilePhoto(file, currentUser.uid);

      await updateProfile(currentUser, { photoURL });
      await createOrUpdateUser(currentUser, { photoURL });

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar foto",
        description: "Ocorreu um erro ao atualizar sua foto. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingCover(true);
    try {
      const file = event.target.files[0];
      const coverURL = await uploadCoverPhoto(file, currentUser.uid);

      await createOrUpdateUser(currentUser, { coverURL });

      toast({
        title: "Capa atualizada",
        description: "Sua foto de capa foi atualizada com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar capa",
        description:
          "Ocorreu um erro ao atualizar sua foto de capa. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleReviewClick = (review: SeriesReview) => {
    setSelectedReviewForDetails(review);
    setIsReviewDetailsOpen(true);
    
    // Invalidar a consulta apenas se não tiver sido atualizada recentemente
    const queryState = queryClient.getQueryState(["reviews", review.seriesId.toString()]);
    const isStale = !queryState || queryState.status !== 'success' || queryState.dataUpdatedAt < Date.now() - 30000;
    
    if (isStale) {
      queryClient.invalidateQueries({ queryKey: ["reviews", review.seriesId.toString()] });
    }
  };

  if (!currentUser && !username) {
    return (
      <Box bg="gray.900" minH="100vh" pt="80px">
        <Container maxW="container.lg" py={8}>
          <Text color="white">
            Você precisa estar logado para acessar esta página.
          </Text>
        </Container>
      </Box>
    );
  }

  const userName = isOwnProfile
    ? currentUser?.displayName || currentUser?.email?.split("@")[0] || "Usuário"
    : profileUser?.displayName ||
      profileUser?.email?.split("@")[0] ||
      "Usuário";

  // Contar listas
  const listsCount = userLists?.length || 0;

  // Função que renderiza a seção ativa (Reviews, Watchlist ou Listas)
  const renderActiveSection = () => {
    if (isLoadingLists) {
      return (
        <Center p={8}>
          <Spinner size="xl" color="primary.500" />
        </Center>
      );
    }

    const section = showLists ? "lists" : showWatchlist ? "watchlist" : "reviews";
    
    switch (section) {
      case "reviews":
        return (
          <ReviewsSection
            reviews={reviews}
            isLoading={isLoadingReviews}
            onReviewClick={handleReviewClick}
          />
        );
      case "watchlist":
        return (
          <WatchlistSection 
            watchlist={watchlist} 
            isLoading={isLoadingWatchlist}
            isOwnProfile={isOwnProfile === true}
            currentUser={currentUser}
          />
        );
      case "lists":
        return (
          <ListsSection
            userId={targetUserId || ''}
            isOwnProfile={isOwnProfile === true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        {/* Cabeçalho do Perfil */}
        <ProfileHeader
          isOwnProfile={!!isOwnProfile}
          profileUser={profileUser}
          currentUser={currentUser}
          userName={userName}
          uploadingPhoto={uploadingPhoto}
          uploadingCover={uploadingCover}
          handlePhotoUpload={handlePhotoUpload}
          handleCoverUpload={handleCoverUpload}
          targetUserId={targetUserId || ""}
          followersCount={followers.length}
          followingCount={following.length}
          onShowFollowers={() => setShowFollowers(true)}
          onShowFollowing={() => setShowFollowing(true)}
        />

        <Container maxW="container.lg" pt={0} pb={16} px={{ base: 4, md: 6 }}>
          <VStack spacing={6} align="stretch">
            {/* Stats e Favoritos */}
            <VStack spacing={4} align="stretch">
              <ProfileStats
                reviewsCount={reviews.length}
                watchlistCount={watchlist.length}
                listsCount={listsCount}
                onShowReviews={() => {
                  setShowWatchlist(false);
                  setShowLists(false);
                }}
                onShowWatchlist={() => {
                  setShowWatchlist(true);
                  setShowLists(false);
                }}
                onShowLists={() => {
                  setShowWatchlist(false);
                  setShowLists(true);
                }}
                isOwnProfile={isOwnProfile}
                activeSection={showLists ? "lists" : showWatchlist ? "watchlist" : "reviews"}
              />
            </VStack>

            {/* Conteúdo principal - alternando entre Avaliações, Watchlist e Listas */}
            {renderActiveSection()}
            {selectedReviewForDetails && (
              <ReviewDetailsModal
                isOpen={isReviewDetailsOpen}
                onClose={() => {
                  setIsReviewDetailsOpen(false);
                  setSelectedReviewForDetails(null);
                }}
                review={adaptReviewForDetails(selectedReviewForDetails)}
                onReviewUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ["userReviews", targetUserId] });
                }}
              />
            )}
            
            {selectedReview && (
              <ReviewEditModal
                isOpen={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                review={selectedReview}
                initialSeasonNumber={selectedReview.selectedSeasonNumber}
                onReviewUpdated={() => {
                  setSelectedReview(null);
                  queryClient.invalidateQueries({ queryKey: ["userReviews", targetUserId] });
                }}
              />
            )}

            <UserListModal
              isOpen={showFollowers}
              onClose={() => setShowFollowers(false)}
              title="Seguidores"
              userIds={followers.map((f) => f.followerId)}
              type="followers"
            />

            <UserListModal
              isOpen={showFollowing}
              onClose={() => setShowFollowing(false)}
              title="Seguindo"
              userIds={following.map((f) => f.userId)}
              type="following"
            />
          </VStack>
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}
