import {
  Box,
  Container,
  Text,
  VStack,
  Flex,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  AspectRatio,
  Image,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../config/firebase";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import { UploadSimple } from "@phosphor-icons/react";
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
import { UserListModal } from "../components/user/UserListModal";
import { ExtendedUser } from "../types/auth";
import { ReviewDetailsModal } from "../components/reviews/ReviewDetailsModal";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";

// Componentes modularizados para perfil
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStats } from "../components/profile/ProfileStats";
import { FavoriteSeries } from "../components/profile/FavoriteSeries";
import { ReviewsSection } from "../components/profile/ReviewsSection";
import { WatchlistSection } from "../components/profile/WatchlistSection";

// Função para adaptar a avaliação para o formato esperado pelo ReviewDetailsModal
const adaptReviewForDetails = (review: SeriesReview): any => {
  // Obter a primeira avaliação de temporada (a que é mostrada na lista)
  const firstSeasonReview = review.seasonReviews[0];
  return {
    id: review.id,
    seriesId: review.seriesId.toString(),
    userId: review.userId,
    userEmail: review.userEmail,
    seriesName: review.series.name,
    seriesPoster: review.series.poster_path,
    seasonNumber: firstSeasonReview.seasonNumber,
    rating: firstSeasonReview.rating,
    comment: firstSeasonReview.comment || "",
    comments: firstSeasonReview.comments || [],
    reactions: firstSeasonReview.reactions || { likes: [], dislikes: [] },
    createdAt: firstSeasonReview.createdAt || new Date()
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
          navigate("/");
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
      console.error("Erro ao atualizar perfil:", error);
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
      console.error("Erro ao atualizar foto:", error);
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
      console.error("Erro ao atualizar capa:", error);
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
  };

  if (!currentUser && !username) {
    return (
      <Box bg="gray.900" minH="100vh" pt="80px">
        <Container maxW="1200px" py={8}>
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
        />

        <Container maxW="container.lg" pt={0} pb={16} px={{ base: 4, md: 8 }}>
          <VStack spacing={6} align="stretch">
            {/* Stats e Favoritos */}
            <VStack spacing={4} align="stretch">
              <ProfileStats
                reviewsCount={reviews.length}
                followersCount={followers.length}
                followingCount={following.length}
                onShowFollowers={() => setShowFollowers(true)}
                onShowFollowing={() => setShowFollowing(true)}
              />

              <FavoriteSeries
                isOwnProfile={!!isOwnProfile}
                currentUser={currentUser}
                profileUser={profileUser}
              />
            </VStack>

            {/* Abas de Conteúdo */}
            <Tabs variant="soft-rounded" colorScheme="primary">
              <TabList mb={4} overflowX="auto" pb={2}>
                <Tab
                  color="white"
                  _selected={{ color: "white", bg: "primary.500" }}
                  fontSize={{ base: "sm", md: "md" }}
                  px={{ base: 3, md: 4 }}
                >
                  Avaliações
                </Tab>
                {isOwnProfile && (
                  <Tab
                    color="white"
                    _selected={{ color: "white", bg: "primary.500" }}
                    fontSize={{ base: "sm", md: "md" }}
                    px={{ base: 3, md: 4 }}
                  >
                    Watchlist
                  </Tab>
                )}
              </TabList>

              <TabPanels>
                {/* Painel de Avaliações */}
                <TabPanel p={0}>
                  <ReviewsSection
                    reviews={reviews}
                    isLoading={isLoadingReviews}
                    onReviewClick={handleReviewClick}
                  />
                </TabPanel>

                {/* Painel de Watchlist */}
                {isOwnProfile && (
                  <TabPanel p={0}>
                    <WatchlistSection
                      watchlist={watchlist}
                      isLoading={isLoadingWatchlist}
                      isOwnProfile={!!isOwnProfile}
                      currentUser={currentUser}
                    />
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>

            {/* Modais */}
            <Modal isOpen={isOpen} onClose={onClose} size="md">
              <ModalOverlay />
              <ModalContent bg="gray.800">
                <ModalHeader color="white">Editar Perfil</ModalHeader>
                <Box position="absolute" right={2} top={2}>
                  <ModalCloseButton color="white" />
                </Box>
                <ModalBody pb={6}>
                  <VStack spacing={6}>
                    <FormControl>
                      <FormLabel color="white">Nome</FormLabel>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Seu nome"
                        bg="gray.700"
                        color="white"
                        border="none"
                      />
                    </FormControl>

                    <Button
                      colorScheme="primary"
                      onClick={handleUpdateProfile}
                      isLoading={isUpdating}
                      width="full"
                    >
                      Salvar
                    </Button>
                  </VStack>
                </ModalBody>
              </ModalContent>
            </Modal>

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
