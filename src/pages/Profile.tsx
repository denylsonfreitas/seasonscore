import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Avatar,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  SimpleGrid,
  Spinner,
  Flex,
  useToast,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Image,
  Stat,
  StatLabel,
  StatNumber,
  AspectRatio,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  doc,
  updateDoc,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../config/firebase";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import { Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { RatingStars } from "../components/common/RatingStars";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link as RouterLink, useParams } from "react-router-dom";
import { Footer } from "../components/common/Footer";
import { getUserReviews, SeriesReview } from "../services/reviews";
import { getUserWatchlist } from "../services/watchlist";
import { FollowButton } from "../components/user/FollowButton";
import { getFollowers, getFollowing } from "../services/followers";
import { getUserData, UserData, createOrUpdateUser, getUserByUsername } from "../services/users";
import { UserListModal } from "../components/user/UserListModal";
import { ExtendedUser } from "../types/auth";
import { ScrollToTop } from "../components/common/ScrollToTop";

interface ExpandedReviews {
  [key: string]: boolean;
}

export function Profile() {
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const { username } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const avatarSize = useBreakpointValue({ base: "xl", md: "2xl" });
  const coverHeight = useBreakpointValue({ base: "150px", md: "200px" });
  const containerPadding = useBreakpointValue({ base: 4, md: 8 });
  const ratingStarSize = useBreakpointValue({ base: 16, md: 20 });

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<ExpandedReviews>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !username || (currentUser && profileUser?.id === currentUser.uid);
  const targetUserId = profileUser?.id || currentUser?.uid;

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

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        description: "Ocorreu um erro ao atualizar sua foto de capa. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingCover(false);
    }
  };

  if (!currentUser && !username) {
    return (
      <Box bg="gray.900" minH="100vh" pt="80px">
        <Container maxW="1200px" py={8}>
          <Text color="white">Você precisa estar logado para acessar esta página.</Text>
        </Container>
      </Box>
    );
  }

  const userName = isOwnProfile 
    ? currentUser?.displayName || currentUser?.email?.split("@")[0] || "Usuário"
    : profileUser?.displayName || profileUser?.email?.split("@")[0] || "Usuário";

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" pt={{ base: "60px", md: "80px" }}>
        <Container maxW="container.lg" py={containerPadding} pb={16}>
          <VStack spacing={8} align="stretch">
            <Box position="relative">
              <Box
                h={coverHeight}
                w="100%"
                bg="gray.700"
                borderTopRadius="lg"
                bgImage={isOwnProfile ? currentUser?.coverURL || undefined : profileUser?.coverURL || undefined}
                bgSize="cover"
                bgPosition="center"
              />
              <Box bg="gray.800" borderBottomRadius="lg">
                <Container maxW="container.lg" py={{ base: 4, md: 6 }}>
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    justify="space-between"
                    align={{ base: "center", md: "start" }}
                    spacing={{ base: 4, md: 6 }}
                  >
                    <Stack
                      direction={{ base: "column", md: "row" }}
                      spacing={{ base: 4, md: 6 }}
                      align={{ base: "center", md: "start" }}
                      w="full"
                    >
                      <Box position="relative">
                        <Avatar
                          size={avatarSize}
                          src={isOwnProfile ? currentUser?.photoURL || undefined : profileUser?.photoURL || undefined}
                          name={userName}
                          mt={{ base: "-40px", md: "-60px" }}
                          border="4px solid"
                          borderColor="gray.800"
                        />
                        {isOwnProfile && (
                          <Box
                            position={{ base: "absolute", md: "static" }}
                            right={{ base: "-100px", md: "auto" }}
                            top={{ base: "50%", md: "auto" }}
                            transform={{ base: "translateY(-50%)", md: "none" }}
                            display={{ base: "block", md: "none" }}
                          >
                            <Button
                              as="span"
                              colorScheme="teal"
                              variant="outline"
                              onClick={() => navigate("/settings/profile")}
                              size="sm"
                            >
                              Editar
                            </Button>
                          </Box>
                        )}
                      </Box>
                      <VStack align={{ base: "center", md: "start" }} spacing={2} w="full">
                        <Heading size={{ base: "md", md: "lg" }} color="white" textAlign={{ base: "center", md: "left" }}>
                          {userName}
                        </Heading>
                        <Text 
                          color="gray.500" 
                          fontSize={{ base: "xs", md: "sm" }}
                          textAlign={{ base: "center", md: "left" }}
                          letterSpacing="0.5px"
                          fontWeight="medium"
                        >
                          @{isOwnProfile ? currentUser?.username : profileUser?.username}
                        </Text>
                        {(isOwnProfile ? currentUser?.description : profileUser?.description) && (
                          <Text 
                            color="gray.400" 
                            maxW="600px"
                            textAlign={{ base: "center", md: "left" }}
                            fontSize={{ base: "sm", md: "md" }}
                            mt={2}
                          >
                            {isOwnProfile ? currentUser?.description : profileUser?.description}
                          </Text>
                        )}
                        <Stack
                          direction={{ base: "row", md: "row" }}
                          spacing={{ base: 4, md: 8 }}
                          mt={2}
                          justify={{ base: "center", md: "start" }}
                          wrap="wrap"
                        >
                          <Stat minW={{ base: "auto", md: "100px" }} textAlign={{ base: "center", md: "left" }}>
                            <StatLabel color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Avaliações</StatLabel>
                            <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>{reviews.length}</StatNumber>
                          </Stat>
                          <Stat
                            cursor="pointer"
                            onClick={() => setShowFollowers(true)}
                            _hover={{ color: "teal.300" }}
                            minW={{ base: "auto", md: "100px" }}
                            textAlign={{ base: "center", md: "left" }}
                          >
                            <StatLabel color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Seguidores</StatLabel>
                            <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>{followers.length}</StatNumber>
                          </Stat>
                          <Stat
                            cursor="pointer"
                            onClick={() => setShowFollowing(true)}
                            _hover={{ color: "teal.300" }}
                            minW={{ base: "auto", md: "100px" }}
                            textAlign={{ base: "center", md: "left" }}
                          >
                            <StatLabel color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Seguindo</StatLabel>
                            <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>{following.length}</StatNumber>
                          </Stat>
                        </Stack>
                      </VStack>
                    </Stack>
                    <VStack align={{ base: "center", md: "end" }} spacing={4} w={{ base: "full", md: "auto" }}>
                      <HStack justify={{ base: "center", md: "end" }} w="full">
                        {!isOwnProfile && <FollowButton userId={targetUserId!} />}
                        {isOwnProfile && (
                          <Button
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => navigate("/settings/profile")}
                            size={{ base: "sm", md: "md" }}
                            display={{ base: "none", md: "flex" }}
                          >
                            Editar Perfil
                          </Button>
                        )}
                      </HStack>
                      {(isOwnProfile ? currentUser?.favoriteSeries : profileUser?.favoriteSeries) && (
                        <Stack
                          direction={{ base: "row", md: "row" }}
                          bg="gray.700"
                          p={3}
                          borderRadius="md"
                          spacing={4}
                          align="center"
                          w={{ base: "full", md: "auto" }}
                          justify={{ base: "center", md: "start" }}
                        >
                          <RouterLink to={`/series/${(isOwnProfile ? currentUser?.favoriteSeries : profileUser?.favoriteSeries)?.id}`}>
                            <Image
                              src={`https://image.tmdb.org/t/p/w200${(isOwnProfile ? currentUser?.favoriteSeries : profileUser?.favoriteSeries)?.poster_path}`}
                              alt={(isOwnProfile ? currentUser?.favoriteSeries : profileUser?.favoriteSeries)?.name}
                              borderRadius="md"
                              height={{ base: "50px", md: "60px" }}
                              width={{ base: "35px", md: "60px" }}
                              objectFit="cover"
                            />
                          </RouterLink>
                          <VStack align={{ base: "center", md: "start" }} spacing={0}>
                            <Text color="gray.400" fontSize="xs">
                              Série Favorita
                            </Text>
                            <RouterLink to={`/series/${(isOwnProfile ? currentUser?.favoriteSeries : profileUser?.favoriteSeries)?.id}`}>
                              <Text 
                                color="white" 
                                fontWeight="bold" 
                                fontSize="sm" 
                                noOfLines={2}
                                maxW="150px"
                                textAlign={{ base: "center", md: "left" }}
                                _hover={{ color: "teal.300" }}
                              >
                                {(isOwnProfile ? currentUser?.favoriteSeries : profileUser?.favoriteSeries)?.name}
                              </Text>
                            </RouterLink>
                          </VStack>
                        </Stack>
                      )}
                    </VStack>
                  </Stack>
                </Container>
              </Box>
            </Box>

            <Tabs variant="soft-rounded" colorScheme="teal">
              <TabList mb={4} overflowX="auto" pb={2}>
                <Tab 
                  color="white" 
                  _selected={{ color: "white", bg: "teal.500" }}
                  fontSize={{ base: "sm", md: "md" }}
                  px={{ base: 3, md: 4 }}
                >
                  Avaliações
                </Tab>
                {isOwnProfile && (
                  <Tab 
                    color="white" 
                    _selected={{ color: "white", bg: "teal.500" }}
                    fontSize={{ base: "sm", md: "md" }}
                    px={{ base: 3, md: 4 }}
                  >
                    Watchlist
                  </Tab>
                )}
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  {isLoadingReviews ? (
                    <Flex justify="center" py={8}>
                      <Spinner color="teal.500" />
                    </Flex>
                  ) : reviews.length > 0 ? (
                    <VStack spacing={6} align="stretch">
                      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
                        {reviews
                          .slice(0, showAllReviews ? undefined : 6)
                          .map((review) => (
                            <Box
                              key={review.id}
                              bg="gray.800"
                              p={{ base: 3, md: 4 }}
                              borderRadius="lg"
                            >
                              <Stack direction={{ base: "column", sm: "row" }} spacing={4} align="start">
                                <RouterLink to={`/series/${review.seriesId}`}>
                                  <Box
                                    width={{ base: "100%", sm: "60px" }}
                                    height={{ base: "150px", sm: "90px" }}
                                    borderRadius="md"
                                    overflow="hidden"
                                    bg="gray.700"
                                  >
                                    <Image
                                      src={`https://image.tmdb.org/t/p/w92${review.series.poster_path}`}
                                      alt={review.series.name}
                                      width="100%"
                                      height="100%"
                                      objectFit="cover"
                                      fallback={
                                        <Box
                                          width="100%"
                                          height="100%"
                                          bg="gray.700"
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                        >
                                          <Text color="gray.500" fontSize="xs" textAlign="center">
                                            Sem imagem
                                          </Text>
                                        </Box>
                                      }
                                    />
                                  </Box>
                                </RouterLink>
                                <Box flex="1">
                                  <RouterLink to={`/series/${review.seriesId}`}>
                                    <Text 
                                      color="white" 
                                      fontWeight="bold" 
                                      mb={2} 
                                      _hover={{ color: "teal.300" }}
                                      fontSize={{ base: "sm", md: "md" }}
                                    >
                                      {review.series.name}
                                    </Text>
                                  </RouterLink>
                                  {review.seasonReviews
                                    .slice(0, expandedReviews[review.id] ? undefined : 2)
                                    .map((seasonReview) => (
                                    <Box key={`${review.id}_${seasonReview.seasonNumber}`} mt={4}>
                                      <Text color="gray.400" mb={1} fontSize={{ base: "xs", md: "sm" }}>
                                        Temporada {seasonReview.seasonNumber}
                                      </Text>
                                      <RatingStars rating={seasonReview.rating} size={ratingStarSize} />
                                      {seasonReview.comment && (
                                        <Text color="white" mt={2} fontSize={{ base: "sm", md: "md" }}>
                                          {seasonReview.comment}
                                        </Text>
                                      )}
                                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }} mt={2}>
                                        {seasonReview.createdAt instanceof Date 
                                          ? seasonReview.createdAt.toLocaleDateString()
                                          : new Date(seasonReview.createdAt.seconds * 1000).toLocaleDateString()}
                                      </Text>
                                    </Box>
                                  ))}
                                  {review.seasonReviews.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      size={{ base: "xs", md: "sm" }}
                                      color="teal.400"
                                      mt={2}
                                      onClick={() => toggleReviewExpansion(review.id)}
                                    >
                                      {expandedReviews[review.id]
                                        ? "Ver menos"
                                        : `Ver mais ${review.seasonReviews.length - 2} temporada${review.seasonReviews.length - 2 > 1 ? 's' : ''}`}
                                    </Button>
                                  )}
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                      </SimpleGrid>
                      {reviews.length > 6 && (
                        <Button
                          variant="ghost"
                          color="teal.400"
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          alignSelf="center"
                          size={{ base: "sm", md: "md" }}
                        >
                          {showAllReviews 
                            ? "Ver menos" 
                            : `Ver mais (${reviews.length - 6} avaliações)`}
                        </Button>
                      )}
                    </VStack>
                  ) : (
                    <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>Nenhuma avaliação ainda.</Text>
                  )}
                </TabPanel>

                {isOwnProfile && (
                  <TabPanel p={0}>
                    {isLoadingWatchlist ? (
                      <Flex justify="center" py={8}>
                        <Spinner color="teal.500" />
                      </Flex>
                    ) : watchlist.length > 0 ? (
                      <SimpleGrid columns={{ base: 2, sm: 3, lg: 4 }} spacing={{ base: 3, md: 6 }}>
                        {watchlist.map((item) => (
                          <Box
                            key={item.seriesId}
                            bg="gray.800"
                            p={{ base: 2, md: 4 }}
                            borderRadius="lg"
                            position="relative"
                          >
                            <RouterLink to={`/series/${item.seriesId}`}>
                              <Image
                                src={`https://image.tmdb.org/t/p/w500${item.seriesData.poster_path}`}
                                alt={item.seriesData.name}
                                width="100%"
                                height="auto"
                                borderRadius="md"
                              />
                              <Text 
                                color="white" 
                                fontWeight="bold" 
                                mt={2}
                                fontSize={{ base: "xs", md: "sm" }}
                                noOfLines={2}
                              >
                                {item.seriesData.name}
                              </Text>
                            </RouterLink>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>Nenhuma série na watchlist.</Text>
                    )}
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>

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
                      <FormLabel color="white">Foto de Perfil</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        display="none"
                        ref={photoInputRef}
                        onChange={handlePhotoUpload}
                      />
                      <Box position="relative" width="fit-content" mx="auto">
                        <Avatar
                          size="2xl"
                          src={currentUser?.photoURL || undefined}
                          name={currentUser?.displayName || ""}
                        />
                        <Box
                          position="absolute"
                          bottom="0"
                          right="0"
                          onClick={() => photoInputRef.current?.click()}
                          cursor="pointer"
                        >
                          <Button
                            size="sm"
                            colorScheme="teal"
                            rounded="full"
                            isLoading={uploadingPhoto}
                          >
                            <UploadSimple weight="bold" />
                          </Button>
                        </Box>
                      </Box>
                    </FormControl>

                    <FormControl>
                      <FormLabel color="white">Foto de Capa</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        display="none"
                        ref={coverInputRef}
                        onChange={handleCoverUpload}
                      />
                      <AspectRatio ratio={16/9} maxH="150px">
                        <Box
                          bg="gray.700"
                          borderRadius="md"
                          overflow="hidden"
                          position="relative"
                          cursor="pointer"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {currentUser?.coverURL ? (
                            <Image
                              src={currentUser.coverURL}
                              alt="Foto de capa"
                              objectFit="cover"
                              w="100%"
                              h="100%"
                            />
                          ) : (
                            <Flex
                              align="center"
                              justify="center"
                              h="100%"
                              color="gray.500"
                              flexDir="column"
                            >
                              <ImageIcon size={24} />
                              <Text fontSize="sm" mt={2}>
                                Clique para adicionar uma foto de capa
                              </Text>
                            </Flex>
                          )}
                          {uploadingCover && (
                            <Flex
                              position="absolute"
                              top="0"
                              left="0"
                              right="0"
                              bottom="0"
                              bg="blackAlpha.600"
                              align="center"
                              justify="center"
                            >
                              <Spinner color="teal.500" />
                            </Flex>
                          )}
                        </Box>
                      </AspectRatio>
                    </FormControl>

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
                      colorScheme="teal"
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

            {selectedReview && (
              <ReviewEditModal
                isOpen={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                review={selectedReview}
                initialSeasonNumber={selectedReview.selectedSeasonNumber}
                onReviewUpdated={() => {
                  setSelectedReview(null);
                  queryClient.invalidateQueries({ queryKey: ["userReviews"] });
                }}
              />
            )}

            <UserListModal
              isOpen={showFollowers}
              onClose={() => setShowFollowers(false)}
              title="Seguidores"
              userIds={followers.map(f => f.followerId)}
              type="followers"
            />

            <UserListModal
              isOpen={showFollowing}
              onClose={() => setShowFollowing(false)}
              title="Seguindo"
              userIds={following.map(f => f.userId)}
              type="following"
            />
          </VStack>
        </Container>
      </Box>
      <Footer />
      <ScrollToTop />
    </Flex>
  );
}
