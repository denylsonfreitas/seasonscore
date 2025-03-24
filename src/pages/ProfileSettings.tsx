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
  Textarea,
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
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createOrUpdateUser, getUserData, isUsernameAvailable, updateUsername } from "../services/users";
import { updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getSeriesDetails } from "../services/tmdb";
import { SearchModal } from "../components/layout/SearchModal";
import { ExtendedUser } from "../types/auth";
import { uploadProfilePhoto, uploadCoverPhoto } from "../services/upload";
import {
  Image as ImageIcon,
  UploadSimple,
  Plus,
  X,
} from "@phosphor-icons/react";
import { db, auth } from "../config/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { UserAvatar } from "../components/common/UserAvatar";

export function ProfileSettings() {
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [coverURL, setCoverURL] = useState("");
  const [description, setDescription] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [isRemovingCover, setIsRemovingCover] = useState(false);
  const [tempPhotoURL, setTempPhotoURL] = useState<string | null>(null);
  const [tempCoverURL, setTempCoverURL] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [favoriteSeries, setFavoriteSeries] = useState<{
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
    images?: {
      logos?: Array<{
        file_path: string;
      }>;
    };
  } | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const MAX_NAME_LENGTH = 15;
  const MAX_DESCRIPTION_LENGTH = 150;
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
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
          setDescription(userData.description || "");
          setFavoriteSeries(userData.favoriteSeries || null);
          setNewUsername(userData.username || "");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingPhoto(true);
    try {
      const file = event.target.files[0];
      const photoURL = await uploadProfilePhoto(file, currentUser.uid);
      setTempPhotoURL(photoURL);
      setIsRemovingPhoto(false);

      toast({
        title: "Foto carregada",
        description: "Clique em Salvar Alterações para aplicar as mudanças",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao carregar foto:", error);
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

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files[0] || !currentUser) return;

    setUploadingCover(true);
    try {
      const file = event.target.files[0];
      const coverURL = await uploadCoverPhoto(file, currentUser.uid);
      setTempCoverURL(coverURL);
      setIsRemovingCover(false);

      toast({
        title: "Capa carregada",
        description: "Clique em Salvar Alterações para aplicar as mudanças",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao carregar capa:", error);
      toast({
        title: "Erro ao carregar capa",
        description:
          "Ocorreu um erro ao carregar sua foto de capa. Tente novamente.",
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
        // Se o username é igual ao atual, não precisa verificar disponibilidade
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
        console.error("Erro ao verificar username:", error);
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
    if (!currentUser || !auth.currentUser) return;

    setIsSaving(true);
    try {
      // Validar username se foi alterado
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
        // Atualizar username
        await updateUsername(currentUser.uid, newUsername.toLowerCase());
      }

      // Garantir que as URLs são strings válidas
      // Se tempPhotoURL for null e estamos removendo, queremos remover a foto
      const photoURLToUse = isRemovingPhoto ? null : tempPhotoURL || currentUser?.photoURL;
      const coverURLToUse = isRemovingCover ? null : tempCoverURL || currentUser?.coverURL;

      // Construir objeto base com valores explícitos para permitir remoção
      const baseData = {
        displayName,
        description,
        photoURL: photoURLToUse,
        coverURL: coverURLToUse,
        ...(newUsername ? { username: newUsername.toLowerCase() } : {})
      };

      // Adicionar favoriteSeries explicitamente, permitindo valor null para remover
      const updatedData = {
        ...baseData,
        favoriteSeries
      };

      // Primeiro atualizar o documento do usuário
      await createOrUpdateUser(auth.currentUser, updatedData);

      // Depois atualizar o perfil do usuário autenticado
      // updateProfile não aceita null, então convertemos para undefined
      if (isRemovingPhoto) {
        // Força a remoção da foto de perfil
        try {
          // Primeiro, tentamos o método convencional
          await updateProfile(auth.currentUser, {
            displayName,
            photoURL: '',  // String vazia em vez de null
          });
          
          // Para garantir, também atualizamos diretamente no Firestore
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            photoURL: null
          });
          
        } catch (err) {
          console.error('Error removing photo:', err);
        }
      } else {
        // Atualização normal quando não está removendo a foto
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL: photoURLToUse,
        });
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas configurações foram salvas com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Redirecionar para o perfil
      navigate("/profile", { replace: true });
      window.location.reload();

    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);

      // Mostrar mensagem de erro mais detalhada
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
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

  const handleSeriesSelect = async (seriesId: number) => {
    try {
      const seriesDetails = await getSeriesDetails(seriesId);
      setFavoriteSeries({
        id: seriesId,
        name: seriesDetails.name,
        poster_path: seriesDetails.poster_path ?? "",
        backdrop_path: seriesDetails.backdrop_path ?? "",
        images: seriesDetails.images ? {
          logos: seriesDetails.images.logos ? seriesDetails.images.logos.map(logo => ({
            file_path: logo.file_path
          })) : undefined
        } : undefined
      });
      setIsSearchOpen(false);
    } catch (error) {
      console.error("Erro ao buscar detalhes da série:", error);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setIsRemovingPhoto(true);
    setTempPhotoURL(null);
    toast({
      title: "Foto removida",
      description: "Clique em Salvar Alterações para confirmar a remoção",
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
      description: "Clique em Salvar Alterações para confirmar a remoção",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRemoveFavoriteSeries = () => {
    setFavoriteSeries(null);
    toast({
      title: "Série favorita removida",
      description: "Clique em Salvar Alterações para confirmar a remoção",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Box bg="gray.900" minH="100vh">
        <Container maxW="container.md" py={8}>
          <Spinner color="primary.500" />
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.900" minH="100vh">
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading color="white">Configurações do Perfil</Heading>

          <Box bg="gray.800" p={6} borderRadius="lg">
            <VStack spacing={6} align="stretch">
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
                  {/* Avatar com placeholder quando foto removida */}
                  <UserAvatar
                    size="2xl"
                    photoURL={isRemovingPhoto ? null : (tempPhotoURL || currentUser?.photoURL)}
                    displayName={currentUser?.displayName || ""}
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
                      <MenuList
                        bg="gray.700"
                        borderColor="gray.600"
                        zIndex={2000}
                        minW="150px"
                      >
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
                            bg="gray.700"
                            _hover={{ bg: "gray.600" }}
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
                  >
                    {isRemovingCover ? (
                      // Placeholder quando capa for removida
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
                            <MenuList
                              bg="gray.700"
                              borderColor="gray.600"
                              zIndex={2000}
                              minW="150px"
                            >
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
                                bg="gray.700"
                                _hover={{ bg: "gray.600" }}
                                color="red.300"
                              >
                                Remover capa
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Box>
                      </Flex>
                    ) : (tempCoverURL || currentUser?.coverURL) ? (
                      <>
                        <Image
                          src={
                            tempCoverURL 
                              ? tempCoverURL
                              : currentUser?.coverURL || ''
                          }
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
                            <MenuList
                              bg="gray.700"
                              borderColor="gray.600"
                              zIndex={2000}
                              minW="150px"
                            >
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
                                bg="gray.700"
                                _hover={{ bg: "gray.600" }}
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
                <FormLabel color="white">Nome</FormLabel>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  placeholder="Seu nome"
                  bg="gray.700"
                  color="white"
                  border="none"
                />
                <Text color="gray.400" fontSize="sm" mt={1}>
                  {displayName.length}/{MAX_NAME_LENGTH} caracteres
                </Text>
              </FormControl>

              <FormControl isInvalid={!!usernameError}>
                <FormLabel color="white">Nome de usuário</FormLabel>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Seu nome de usuário"
                  bg="gray.700"
                  color="white"
                  border="none"
                  _placeholder={{ color: "gray.400" }}
                />
                <FormErrorMessage>{usernameError}</FormErrorMessage>
                {!usernameError && newUsername && (
                  <Text color="gray.400" fontSize="sm" mt={1}>
                    {isCurrentUsername ? "Nome de usuário atual" : "Nome de usuário disponível"}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color="white">Descrição</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value.slice(0, MAX_DESCRIPTION_LENGTH)
                    )
                  }
                  placeholder="Fale um pouco sobre você..."
                  bg="gray.700"
                  color="white"
                  border="none"
                  resize="vertical"
                  minH="100px"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <Text color="gray.400" fontSize="sm" mt={1}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH} caracteres
                </Text>
              </FormControl>
              <Button
                colorScheme="primary"
                onClick={handleSave}
                isLoading={isSaving}
                mt={4}
              >
                Salvar Alterações
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSeriesSelect}
      />
    </Box>
  );
}
