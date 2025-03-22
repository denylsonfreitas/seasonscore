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
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../config/firebase";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import {
  Image as ImageIcon,
  UploadSimple,
  Bookmark,
} from "@phosphor-icons/react";
import { RatingStars } from "../components/common/RatingStars";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link as RouterLink, useParams } from "react-router-dom";
import { Footer } from "../components/common/Footer";
import { getUserReviews, SeriesReview } from "../services/reviews";
import { getUserWatchlist, removeFromWatchlist } from "../services/watchlist";
import { FollowButton } from "../components/user/FollowButton";
import { getFollowers, getFollowing } from "../services/followers";
import {
  getUserData,
  UserData,
  createOrUpdateUser,
  getUserByUsername,
} from "../services/users";
import { UserListModal } from "../components/user/UserListModal";
import { ExtendedUser } from "../types/auth";

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

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  );
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

  const isOwnProfile =
    !username || (currentUser && profileUser?.id === currentUser.uid);
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
        {/* Banner de perfil estilo TrendingBanner */}
        <Box
          position="relative"
          sx={{
            width: "100vw",
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
            paddingTop: "60px",
            marginTop: "-60px",
            position: "relative",
            zIndex: 1,
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        >
          <Box
            h={{ base: "200px", md: "300px" }}
            w="100%"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgImage={
                isOwnProfile
                  ? currentUser?.coverURL || "url('/images/default-cover.jpg')"
                  : profileUser?.coverURL || "url('/images/default-cover.jpg')"
              }
              bgSize="cover"
              bgPosition="center"
              transition="all 0.5s ease-in-out"
              transform="scale(1)"
              _hover={{ transform: "scale(1.05)" }}
              _after={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.3), rgba(23, 25, 35, 0.9) 60%, rgba(23, 25, 35, 1))",
              }}
            />

            <Input
              type="file"
              accept="image/*"
              display="none"
              ref={coverInputRef}
              onChange={handleCoverUpload}
            />
          </Box>

          <Container
            maxW="container.lg"
            position="relative"
            px={{ base: 4, md: 8 }}
          >
            <Flex
              direction="row"
              position="relative"
              mt={{ base: "-80px", md: "-100px" }}
              align="center"
              justify="space-between"
              mb={6}
            >
              <Flex
                direction="row"
                align="center"
                gap={4}
                flex="1"
                maxW={{ base: "75%", md: "80%" }}
              >
                <Box position="relative">
                  <Box
                    borderRadius="full"
                    bg="gray.700"
                    p="3px"
                    boxShadow="0 4px 12px rgba(0,0,0,0.5)"
                    display="inline-block"
                  >
                    <Avatar
                      size={{ base: "xl", md: "2xl" }}
                      src={
                        isOwnProfile
                          ? currentUser?.photoURL || undefined
                          : profileUser?.photoURL || undefined
                      }
                      name={userName}
                    />
                  </Box>
                  <Input
                    type="file"
                    accept="image/*"
                    display="none"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                  />
                </Box>

                <VStack
                  align="flex-start"
                  spacing={1}
                  maxW={{ base: "160px", md: "600px" }}
                >
                  <Heading
                    size={{ base: "md", md: "xl" }}
                    color="white"
                    textShadow="0 2px 4px rgba(0,0,0,0.3)"
                    textAlign="left"
                    noOfLines={1}
                  >
                    {userName}
                  </Heading>
                  <Text
                    color="gray.300"
                    fontSize={{ base: "xs", md: "md" }}
                    textAlign="left"
                    letterSpacing="0.5px"
                    fontWeight="medium"
                    noOfLines={1}
                  >
                    @
                    {isOwnProfile
                      ? currentUser?.username
                      : profileUser?.username}
                  </Text>
                  {(isOwnProfile
                    ? currentUser?.description
                    : profileUser?.description) && (
                    <Text
                      color="gray.200"
                      maxW="600px"
                      textAlign="left"
                      fontSize={{ base: "xs", md: "md" }}
                      mt={1}
                      noOfLines={{ base: 1, md: 2 }}
                    >
                      {isOwnProfile
                        ? currentUser?.description
                        : profileUser?.description}
                    </Text>
                  )}
                </VStack>
              </Flex>

              <Box>
                {!isOwnProfile && <FollowButton userId={targetUserId!} />}
                {isOwnProfile && (
                  <Button
                    colorScheme="teal"
                    onClick={() => navigate("/settings/profile")}
                    size={{ base: "sm", md: "md" }}
                  >
                    Editar Perfil
                  </Button>
                )}
              </Box>
            </Flex>

            <VStack spacing={4} align="stretch" mb={6}>
              <HStack
                spacing={{ base: 4, md: 8 }}
                justify="center"
                bg="gray.800"
                p={{ base: 3, md: 4 }}
                borderRadius="lg"
                boxShadow="0 4px 12px rgba(0,0,0,0.1)"
              >
                <Stat textAlign="center" flex="1">
                  <StatLabel
                    color="gray.400"
                    fontSize={{ base: "xs", md: "sm" }}
                  >
                    Avaliações
                  </StatLabel>
                  <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
                    {reviews.length}
                  </StatNumber>
                </Stat>
                <Stat
                  cursor="pointer"
                  onClick={() => setShowFollowers(true)}
                  _hover={{ color: "teal.300" }}
                  textAlign="center"
                  flex="1"
                >
                  <StatLabel
                    color="gray.400"
                    fontSize={{ base: "xs", md: "sm" }}
                  >
                    Seguidores
                  </StatLabel>
                  <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
                    {followers.length}
                  </StatNumber>
                </Stat>
                <Stat
                  cursor="pointer"
                  onClick={() => setShowFollowing(true)}
                  _hover={{ color: "teal.300" }}
                  textAlign="center"
                  flex="1"
                >
                  <StatLabel
                    color="gray.400"
                    fontSize={{ base: "xs", md: "sm" }}
                  >
                    Seguindo
                  </StatLabel>
                  <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
                    {following.length}
                  </StatNumber>
                </Stat>
              </HStack>

              {(isOwnProfile
                ? currentUser?.favoriteSeries
                : profileUser?.favoriteSeries) && (
                <Box
                  bg="gray.800"
                  borderRadius="lg"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  height={{ base: "100px", md: "120px" }}
                  position="relative"
                  overflow="hidden"
                >
                  <RouterLink
                    to={`/series/${
                      (isOwnProfile
                        ? currentUser?.favoriteSeries
                        : profileUser?.favoriteSeries
                      )?.id
                    }`}
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bgImage={`url(https://image.tmdb.org/t/p/w780${
                        (isOwnProfile
                          ? currentUser?.favoriteSeries
                          : profileUser?.favoriteSeries
                        )?.backdrop_path ||
                        (isOwnProfile
                          ? currentUser?.favoriteSeries
                          : profileUser?.favoriteSeries
                        )?.poster_path
                      })`}
                      bgSize="cover"
                      bgPosition="center"
                      transition="all 0.3s ease"
                      _hover={{ transform: "scale(1.05)" }}
                      _after={{
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.3), rgba(23, 25, 35, 0.8))",
                      }}
                    />

                    <Flex
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      align="center"
                      justify="center"
                      p={4}
                      zIndex={1}
                    >
                      {(
                        isOwnProfile
                          ? currentUser?.favoriteSeries?.images?.logos?.[0]
                              ?.file_path
                          : profileUser?.favoriteSeries?.images?.logos?.[0]
                              ?.file_path
                      ) ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${
                            isOwnProfile
                              ? currentUser?.favoriteSeries?.images?.logos?.[0]
                                  ?.file_path
                              : profileUser?.favoriteSeries?.images?.logos?.[0]
                                  ?.file_path
                          }`}
                          alt={
                            (isOwnProfile
                              ? currentUser?.favoriteSeries?.name
                              : profileUser?.favoriteSeries?.name) || ""
                          }
                          maxH={{ base: "60px", md: "70px" }}
                          objectFit="contain"
                        />
                      ) : (
                        <Text
                          color="white"
                          fontWeight="bold"
                          fontSize={{ base: "md", md: "lg" }}
                          textAlign="center"
                          textShadow="0 2px 4px rgba(0,0,0,0.4)"
                          noOfLines={2}
                        >
                          {
                            (isOwnProfile
                              ? currentUser?.favoriteSeries
                              : profileUser?.favoriteSeries
                            )?.name
                          }
                        </Text>
                      )}
                    </Flex>
                  </RouterLink>
                </Box>
              )}
            </VStack>
          </Container>
        </Box>

        <Container maxW="container.lg" pt={0} pb={16} px={{ base: 4, md: 8 }}>
          <VStack spacing={6} align="stretch">
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
                      <SimpleGrid
                        columns={{ base: 1, sm: 2, lg: 3 }}
                        spacing={{ base: 4, md: 6 }}
                      >
                        {reviews
                          .slice(0, showAllReviews ? undefined : 6)
                          .map((review) => (
                            <Box
                              key={review.id}
                              bg="gray.800"
                              p={{ base: 3, md: 4 }}
                              borderRadius="lg"
                            >
                              <Stack
                                direction={{ base: "column", sm: "row" }}
                                spacing={4}
                                align="start"
                              >
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
                                          <Text
                                            color="gray.500"
                                            fontSize="xs"
                                            textAlign="center"
                                          >
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
                                    .slice(
                                      0,
                                      expandedReviews[review.id] ? undefined : 2
                                    )
                                    .map((seasonReview) => (
                                      <Box
                                        key={`${review.id}_${seasonReview.seasonNumber}`}
                                        mt={4}
                                      >
                                        <Text
                                          color="gray.400"
                                          mb={1}
                                          fontSize={{ base: "xs", md: "sm" }}
                                        >
                                          Temporada {seasonReview.seasonNumber}
                                        </Text>
                                        <RatingStars
                                          rating={seasonReview.rating}
                                          size={ratingStarSize}
                                        />
                                        {seasonReview.comment && (
                                          <Text
                                            color="white"
                                            mt={2}
                                            fontSize={{ base: "sm", md: "md" }}
                                          >
                                            {seasonReview.comment}
                                          </Text>
                                        )}
                                        <Text
                                          color="gray.400"
                                          fontSize={{ base: "xs", md: "sm" }}
                                          mt={2}
                                        >
                                          {seasonReview.createdAt instanceof
                                          Date
                                            ? seasonReview.createdAt.toLocaleDateString()
                                            : new Date(
                                                seasonReview.createdAt.seconds *
                                                  1000
                                              ).toLocaleDateString()}
                                        </Text>
                                      </Box>
                                    ))}
                                  {review.seasonReviews.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      size={{ base: "xs", md: "sm" }}
                                      color="teal.400"
                                      mt={2}
                                      onClick={() =>
                                        toggleReviewExpansion(review.id)
                                      }
                                    >
                                      {expandedReviews[review.id]
                                        ? "Ver menos"
                                        : `Ver mais ${
                                            review.seasonReviews.length - 2
                                          } temporada${
                                            review.seasonReviews.length - 2 > 1
                                              ? "s"
                                              : ""
                                          }`}
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
                    <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>
                      Nenhuma avaliação ainda.
                    </Text>
                  )}
                </TabPanel>

                {isOwnProfile && (
                  <TabPanel p={0}>
                    {isLoadingWatchlist ? (
                      <Flex justify="center" py={8}>
                        <Spinner color="teal.500" />
                      </Flex>
                    ) : watchlist.length > 0 ? (
                      <SimpleGrid
                        columns={{ base: 2, sm: 3, lg: 4 }}
                        spacing={{ base: 3, md: 6 }}
                      >
                        {watchlist.map((item) => (
                          <Box
                            key={item.seriesId}
                            bg="gray.800"
                            p={{ base: 2, md: 4 }}
                            borderRadius="lg"
                            position="relative"
                            _hover={{
                              "& .remove-button": {
                                opacity: 1,
                              },
                            }}
                          >
                            {isOwnProfile && (
                              <IconButton
                                aria-label="Remover da watchlist"
                                icon={<Bookmark weight="fill" />}
                                size="sm"
                                variant="solid"
                                colorScheme="red"
                                position="absolute"
                                top={3}
                                right={3}
                                zIndex={2}
                                opacity={0}
                                className="remove-button"
                                transition="opacity 0.2s"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!currentUser) return;

                                  try {
                                    await removeFromWatchlist(
                                      currentUser.uid,
                                      item.seriesId
                                    );
                                    queryClient.invalidateQueries({
                                      queryKey: ["userWatchlist"],
                                    });
                                    toast({
                                      title: "Removido da watchlist",
                                      status: "success",
                                      duration: 2000,
                                    });
                                  } catch (error) {
                                    console.error(
                                      "Erro ao remover da watchlist:",
                                      error
                                    );
                                    toast({
                                      title: "Erro ao remover da watchlist",
                                      status: "error",
                                      duration: 3000,
                                    });
                                  }
                                }}
                              />
                            )}
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
                      <Text
                        color="gray.400"
                        fontSize={{ base: "sm", md: "md" }}
                      >
                        Nenhuma série na watchlist.
                      </Text>
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
                        <Box
                          borderRadius="full"
                          bg="teal.500"
                          p="3px"
                          boxShadow="0 4px 12px rgba(0,0,0,0.5)"
                          display="inline-block"
                        >
                          <Avatar
                            size="2xl"
                            src={currentUser?.photoURL || undefined}
                            name={currentUser?.displayName || ""}
                          />
                        </Box>
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
                      <AspectRatio ratio={16 / 9} maxH="150px">
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
