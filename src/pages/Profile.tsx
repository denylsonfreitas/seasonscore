import { Box, Text, VStack, Flex, useToast, Center, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import { useNavigate, useParams } from "react-router-dom";
import { getUserReviews, SeriesReview } from "../services/reviews";
import { getUserWatchlist } from "../services/watchlist";
import { getFollowers, getFollowing } from "../services/followers";
import { getUserData, UserData, updateProfile, getUserByUsername } from "../services/users";
import { getUserLists } from "../services/lists";
import { UserListModal } from "../components/user/UserListModal";
// Componentes modularizados para perfil
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStats } from "../components/profile/ProfileStats";
import { ReviewsSection } from "../components/profile/ReviewsSection";
import { WatchlistSection } from "../components/profile/WatchlistSection";
import { ListsSection } from "../components/profile/ListsSection";
import { PageContainer } from "../components/layout/PageContainer";

export function Profile() {
  const { currentUser, refreshUser } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const isOwnProfile = !username || (currentUser && profileUser?.id === currentUser.uid);
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
    staleTime: 0,
  });

  const { data: watchlist = [], isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ["userWatchlist", targetUserId],
    queryFn: () => getUserWatchlist(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", targetUserId],
    queryFn: () => getFollowers(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", targetUserId],
    queryFn: () => getFollowing(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: userLists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: ["userLists", targetUserId],
    queryFn: () => getUserLists(targetUserId || ""),
    enabled: !!targetUserId,
  });

  // Manipuladores de eventos
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingPhoto(true);
    try {
      const file = event.target.files[0];
      const photoURL = await uploadProfilePhoto(file, currentUser.uid);

      await updateProfile(currentUser.uid, { photoURL });
      await refreshUser();

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

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingCover(true);
    try {
      const file = event.target.files[0];
      const coverURL = await uploadCoverPhoto(file, currentUser.uid);

      await updateProfile(currentUser.uid, { coverURL });
      await refreshUser();

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
        description: "Ocorreu um erro ao atualizar sua foto de capa. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleReviewClick = (review: SeriesReview) => {
    navigate(`/reviews/${review.id}/${review.selectedSeasonNumber}`);
  };

  if (!currentUser && !username) {
    return (
      <Box pt={8}>
        <PageContainer py={8}>
          <Text color="white">Você precisa estar logado para acessar esta página.</Text>
        </PageContainer>
      </Box>
    );
  }

  const userName = isOwnProfile
    ? currentUser?.displayName || currentUser?.username || "Usuário"
    : profileUser?.displayName || profileUser?.username || "Usuário";

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
        return <ListsSection userId={targetUserId || ""} isOwnProfile={isOwnProfile === true} />;
      default:
        return null;
    }
  };

  return (
    <Flex direction="column">
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

        <PageContainer pt={0} pb={16}>
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
        </PageContainer>
      </Box>
    </Flex>
  );
}
