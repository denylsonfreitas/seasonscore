import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Image,
  Spinner,
  AspectRatio,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  FormErrorMessage,
  Textarea,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserData,
  isUsernameAvailable,
  updateProfile,
  updateUsername,
  type FavoriteSeries,
} from "../services/users";
import { getSeriesDetails } from "../services/tmdb";
import { SearchModal } from "../components/layout/SearchModal";
import { useNavigate } from "react-router-dom";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import { Image as ImageIcon, UploadSimple, Plus, X } from "@phosphor-icons/react";
import { UserAvatar } from "../components/common/UserAvatar";
import { logError } from "../utils/logger";

export function ProfileSettings() {
  const { currentUser, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [, setCoverURL] = useState("");
  const [, setUploadingPhoto] = useState(false);
  const [, setUploadingCover] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [isRemovingCover, setIsRemovingCover] = useState(false);
  const [tempPhotoURL, setTempPhotoURL] = useState<string | null>(null);
  const [tempCoverURL, setTempCoverURL] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const MAX_NAME_LENGTH = 15;
  const MAX_BIO_LENGTH = 160;
  const [bio, setBio] = useState("");
  const [favorite, setFavorite] = useState<FavoriteSeries | null>(null);
  const favoritePicker = useDisclosure();

  const pickFavorite = async (seriesId: number) => {
    favoritePicker.onClose();
    try {
      const series = await getSeriesDetails(seriesId);
      setFavorite({
        id: series.id,
        name: series.name,
        poster_path: series.poster_path ?? "",
        backdrop_path: series.backdrop_path ?? "",
      });
    } catch (error) {
      logError("pickFavorite", error);
    }
  };
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [, setIsCheckingUsername] = useState(false);
  const [isCurrentUsername, setIsCurrentUsername] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;

      try {
        // Resetar os estados de remoção
        setIsRemovingPhoto(false);
        setIsRemovingCover(false);
        setTempPhotoURL(null);
        setTempCoverURL(null);

        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setDisplayName(userData.displayName || "");
          setCoverURL(userData.coverURL || "");
          setNewUsername(userData.username || "");
          setBio(userData.description || "");
          setFavorite(userData.favoriteSeries ?? null);
        }
      } catch (error) {
        logError("loadUserData", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingPhoto(true);
    try {
      const file = event.target.files[0];
      const photoURL = await uploadProfilePhoto(file, currentUser.uid);
      setTempPhotoURL(photoURL);
      setIsRemovingPhoto(false);

      toast({
        title: "Foto carregada",
        description: "Clique em Salvar alterações para aplicar as mudanças",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar foto",
        description: "Ocorreu um erro ao carregar sua foto. Tente novamente.",
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
      setTempCoverURL(coverURL);
      setIsRemovingCover(false);

      toast({
        title: "Capa carregada",
        description: "Clique em Salvar alterações para aplicar as mudanças",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar capa",
        description: "Ocorreu um erro ao carregar sua foto de capa. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const checkUsername = async (username: string) => {
    if (username.length >= 3) {
      setIsCheckingUsername(true);
      try {
        const userData = await getUserData(currentUser?.uid || "");
        if (userData?.username?.toLowerCase() === username.toLowerCase()) {
          setUsernameError("");
          setIsCurrentUsername(true);
          return;
        }
        setIsCurrentUsername(false);

        const isAvailable = await isUsernameAvailable(username.toLowerCase());
        if (!isAvailable) {
          setUsernameError("Este nome de usuário já está em uso");
        } else {
          setUsernameError("");
        }
      } catch (error) {
        logError("checkUsername", error);
      } finally {
        setIsCheckingUsername(false);
      }
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (newUsername) {
        if (newUsername.length < 3) {
          setUsernameError("O nome de usuário deve ter pelo menos 3 caracteres");
        } else if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
          setUsernameError("O nome de usuário pode conter apenas letras, números e underscore");
        } else {
          checkUsername(newUsername);
        }
      } else {
        setUsernameError("");
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [newUsername]);

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const userData = await getUserData(currentUser.uid);
      const currentUsername = userData?.username?.toLowerCase();

      if (newUsername && newUsername.toLowerCase() !== currentUsername) {
        if (newUsername.length < 3) {
          throw new Error("O nome de usuário deve ter pelo menos 3 caracteres");
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
          throw new Error("O nome de usuário pode conter apenas letras, números e underscore");
        }
        const isAvailable = await isUsernameAvailable(newUsername.toLowerCase());
        if (!isAvailable) {
          throw new Error("Este nome de usuário já está em uso");
        }
        await updateUsername(currentUser.uid, newUsername.toLowerCase());
      }

      const photoURLToUse = isRemovingPhoto ? null : tempPhotoURL || currentUser?.photoURL;
      const coverURLToUse = isRemovingCover ? null : tempCoverURL || currentUser?.coverURL;

      await updateProfile(currentUser.uid, {
        displayName,
        description: bio.trim(),
        favoriteSeries: favorite,
        photoURL: photoURLToUse ?? null,
        coverURL: coverURLToUse ?? null,
      });
      await refreshUser();

      toast({
        title: "Perfil atualizado",
        description: "Suas configurações foram salvas com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/profile", { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao atualizar perfil",
        description: `Ocorreu um erro ao salvar suas configurações: ${errorMessage}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setIsRemovingPhoto(true);
    setTempPhotoURL(null);
    toast({
      title: "Foto removida",
      description: "Clique em Salvar alterações para confirmar a remoção",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRemoveCoverPhoto = () => {
    setIsRemovingCover(true);
    setTempCoverURL(null);
    toast({
      title: "Capa removida",
      description: "Clique em Salvar alterações para confirmar a remoção",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Container maxW="container.md" py={8}>
          <Spinner color="signal.400" />
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="h1">
            Editar perfil
          </Heading>

          <Box p={{ base: 4, md: 6 }} border="1px solid" borderColor="ink.800" borderRadius="lg">
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel>Foto de perfil</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  display="none"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                />
                <Box position="relative" width="fit-content" mx="auto">
                  {/* Avatar com placeholder quando foto removida */}
                  <UserAvatar
                    size="2xl"
                    photoURL={isRemovingPhoto ? null : tempPhotoURL || currentUser?.photoURL}
                    name={currentUser?.displayName || ""}
                    userId={currentUser?.uid}
                  />
                  <Box
                    position="absolute"
                    bottom={-2}
                    right={-2}
                    bg="gray.800"
                    p={1}
                    borderRadius="full"
                  >
                    <Menu placement="bottom-end" offset={[0, 4]}>
                      <MenuButton
                        as={IconButton}
                        icon={<Plus weight="bold" />}
                        size="sm"
                        colorScheme="primary"
                        rounded="full"
                        aria-label="Opções de foto de perfil"
                      />
                      <MenuList zIndex={2000} minW="150px">
                        <MenuItem
                          icon={<UploadSimple weight="bold" />}
                          onClick={() => photoInputRef.current?.click()}
                          bg="gray.700"
                          _hover={{ bg: "gray.600" }}
                          color="white"
                        >
                          Mudar foto
                        </MenuItem>
                        {(tempPhotoURL || currentUser?.photoURL) && (
                          <MenuItem
                            icon={<X weight="bold" />}
                            onClick={handleRemoveProfilePhoto}
                            color="red.300"
                          >
                            Remover foto
                          </MenuItem>
                        )}
                      </MenuList>
                    </Menu>
                  </Box>
                </Box>
              </FormControl>

              <FormControl>
                <FormLabel>Foto de capa</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  display="none"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                />
                <AspectRatio ratio={16 / 9} maxH="150px">
                  <Box bg="gray.700" borderRadius="md" overflow="hidden" position="relative">
                    {isRemovingCover ? (
                      <Flex
                        align="center"
                        justify="center"
                        h="100%"
                        color="gray.500"
                        flexDir="column"
                        position="relative"
                      >
                        <ImageIcon size={24} />
                        <Text fontSize="sm" mt={2}>
                          Capa será removida
                        </Text>
                        <Box
                          position="absolute"
                          top={2}
                          right={2}
                          bg="blackAlpha.600"
                          p={1}
                          borderRadius="full"
                        >
                          <Menu placement="bottom-end" offset={[0, 4]}>
                            <MenuButton
                              as={IconButton}
                              icon={<Plus weight="bold" />}
                              size="sm"
                              colorScheme="primary"
                              rounded="full"
                              aria-label="Opções de foto de capa"
                            />
                            <MenuList zIndex={2000} minW="150px">
                              <MenuItem
                                icon={<UploadSimple weight="bold" />}
                                onClick={() => coverInputRef.current?.click()}
                                bg="gray.700"
                                _hover={{ bg: "gray.600" }}
                                color="white"
                              >
                                Mudar capa
                              </MenuItem>
                              <MenuItem
                                icon={<X weight="bold" />}
                                onClick={handleRemoveCoverPhoto}
                                color="red.300"
                              >
                                Remover capa
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Box>
                      </Flex>
                    ) : tempCoverURL || currentUser?.coverURL ? (
                      <>
                        <Image
                          src={tempCoverURL ? tempCoverURL : currentUser?.coverURL || ""}
                          alt="Foto de capa"
                          objectFit="cover"
                          w="100%"
                          h="100%"
                        />
                        <Box
                          position="absolute"
                          top={2}
                          right={2}
                          bg="blackAlpha.600"
                          p={1}
                          borderRadius="full"
                        >
                          <Menu placement="bottom-end" offset={[0, 4]}>
                            <MenuButton
                              as={IconButton}
                              icon={<Plus weight="bold" />}
                              size="sm"
                              colorScheme="primary"
                              rounded="full"
                              aria-label="Opções de foto de capa"
                            />
                            <MenuList zIndex={2000} minW="150px">
                              <MenuItem
                                icon={<UploadSimple weight="bold" />}
                                onClick={() => coverInputRef.current?.click()}
                                bg="gray.700"
                                _hover={{ bg: "gray.600" }}
                                color="white"
                              >
                                Mudar capa
                              </MenuItem>
                              <MenuItem
                                icon={<X weight="bold" />}
                                onClick={handleRemoveCoverPhoto}
                                color="red.300"
                              >
                                Remover capa
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Box>
                      </>
                    ) : (
                      <Flex
                        align="center"
                        justify="center"
                        h="100%"
                        color="gray.500"
                        flexDir="column"
                        onClick={() => coverInputRef.current?.click()}
                        cursor="pointer"
                      >
                        <ImageIcon size={24} />
                        <Text fontSize="sm" mt={2}>
                          Clique para adicionar uma foto de capa
                        </Text>
                      </Flex>
                    )}
                  </Box>
                </AspectRatio>
              </FormControl>

              <FormControl>
                <FormLabel>Nome</FormLabel>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  placeholder="Seu nome"
                />
                <Text color="ink.400" fontSize="xs" mt={1.5} fontFamily="mono">
                  {displayName.length}/{MAX_NAME_LENGTH} caracteres
                </Text>
              </FormControl>

              <FormControl isInvalid={!!usernameError}>
                <FormLabel>Nome de usuário</FormLabel>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Seu nome de usuário"
                />
                <FormErrorMessage>{usernameError}</FormErrorMessage>
                {!usernameError && newUsername && (
                  <Text color="ink.400" fontSize="xs" mt={1.5} fontFamily="mono">
                    {isCurrentUsername ? "Nome de usuário atual" : "Nome de usuário disponível"}
                  </Text>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                  placeholder="Que tipo de série você gosta?"
                  rows={3}
                  resize="vertical"
                />
                <Text color="ink.400" fontSize="xs" mt={1.5} fontFamily="mono">
                  {bio.length}/{MAX_BIO_LENGTH}
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Série favorita</FormLabel>
                {favorite ? (
                  <HStack
                    spacing={3}
                    p={2.5}
                    border="1px solid"
                    borderColor="ink.700"
                    borderRadius="md"
                  >
                    {favorite.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${favorite.poster_path}`}
                        alt=""
                        w="32px"
                        borderRadius="sm"
                      />
                    )}
                    <Text flex={1} fontSize="sm" fontWeight={500} noOfLines={1}>
                      {favorite.name}
                    </Text>
                    <Button size="sm" variant="ghost" onClick={favoritePicker.onOpen}>
                      Trocar
                    </Button>
                    <IconButton
                      aria-label="Remover série favorita"
                      icon={<X size={14} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setFavorite(null)}
                    />
                  </HStack>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={favoritePicker.onOpen}
                  >
                    Escolher série
                  </Button>
                )}
                <Text color="ink.400" fontSize="xs" mt={1.5}>
                  Aparece no seu perfil e serve de capa quando você não tem uma.
                </Text>
              </FormControl>

              <SearchModal
                isOpen={favoritePicker.isOpen}
                onClose={favoritePicker.onClose}
                onSelect={pickFavorite}
                title="Série favorita"
                subtitle="Busque a série que mais representa você"
              />

              <Button onClick={handleSave} isLoading={isSaving} mt={4}>
                Salvar alterações
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
