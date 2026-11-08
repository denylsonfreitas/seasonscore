import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Link,
  SimpleGrid,
  Skeleton,
  Tag,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { ChatCircle, Lock, NotePencil, Plus, Share, X, ListBullets } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import {
  addSeriesToList,
  getListById,
  removeSeriesFromList,
  toggleListReaction,
} from "../services/lists";
import type { SeriesListItem } from "../services/tmdb";
import type { ListWithUserData } from "../types/list";
import { SeriesCard } from "../components/series/SeriesCard";
import { CommentSection } from "../components/common/CommentSection";
import { ReactionButton } from "../components/common/ReactionButton";
import { UserAvatar } from "../components/common/UserAvatar";
import { EmptyState } from "../components/common/EmptyState";
import { EditListModal } from "../components/lists/EditListModal";
import { AddSeriesModal } from "../components/lists/AddSeriesModal";
import { PageContainer } from "../components/layout/PageContainer";
import { getGlobalLoginPopover } from "../components/layout/Navbar";
import { SEO } from "../components/common/SEO";
import { getErrorMessage } from "../utils/errors";

export default function ListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const edit = useDisclosure();
  const addSeries = useDisclosure();
  const removeAlert = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [list, setList] = useState<ListWithUserData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [toRemove, setToRemove] = useState<{ id: number; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["list", listId],
    queryFn: () => getListById(listId!),
    enabled: !!listId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isError || (!isLoading && data === null)) navigate("/404", { replace: true });
  }, [isError, isLoading, data, navigate]);

  // Estado local para atualizar a tela na hora (curtir, adicionar, remover)
  useEffect(() => {
    if (!data) return;
    setList(data);
    setLikesCount(data.likesCount || 0);
    setIsLiked(
      !!currentUser &&
        !!data.reactions?.some((r) => r.userId === currentUser.uid && r.type === "like")
    );
  }, [data, currentUser]);

  const isOwner = !!currentUser && list?.userId === currentUser.uid;
  const existingIds = useMemo(() => new Set(list?.items.map((i) => i.seriesId)), [list]);

  const invalidateLists = () => {
    for (const key of ["list", "popularLists", "userLists", "profileLists", "followedUsersLists"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) {
      getGlobalLoginPopover()?.();
      return;
    }
    if (!list || isTogglingLike) return;
    const wasLiked = isLiked;
    setIsTogglingLike(true);
    setIsLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const result = await toggleListReaction(list.id, "like");
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      invalidateLists();
    } catch (error) {
      setIsLiked(wasLiked);
      setLikesCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      toast({
        title: getErrorMessage(error) || "Não foi possível curtir",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleAdd = async (series: SeriesListItem) => {
    if (!list) return;
    try {
      await addSeriesToList(list.id, {
        id: series.id,
        name: series.name,
        poster_path: series.poster_path,
      });
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: [
                ...prev.items,
                {
                  seriesId: series.id,
                  name: series.name,
                  poster_path: series.poster_path,
                  addedAt: new Date(),
                },
              ],
            }
          : prev
      );
      invalidateLists();
    } catch (error) {
      toast({
        title: getErrorMessage(error) || "Não foi possível adicionar",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleRemove = async () => {
    if (!list || !toRemove) return;
    setIsRemoving(true);
    try {
      await removeSeriesFromList(list.id, toRemove.id);
      setList((prev) =>
        prev ? { ...prev, items: prev.items.filter((i) => i.seriesId !== toRemove.id) } : prev
      );
      invalidateLists();
      toast({ title: `${toRemove.name} saiu da lista`, status: "success", duration: 2000 });
    } catch (error) {
      toast({
        title: getErrorMessage(error) || "Não foi possível remover",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsRemoving(false);
      setToRemove(null);
      removeAlert.onClose();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiado", status: "success", duration: 2000 });
    } catch {
      toast({ title: "Não foi possível copiar o link", status: "error", duration: 3000 });
    }
  };

  if (isLoading || !list) {
    return (
      <PageContainer py={10}>
        <Skeleton h="36px" w="50%" startColor="ink.900" endColor="ink.850" />
        <Skeleton mt={3} h="16px" w="30%" startColor="ink.900" endColor="ink.850" />
        <SimpleGrid mt={10} columns={{ base: 3, md: 5, lg: 6 }} spacing={4}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              aspectRatio={2 / 3}
              borderRadius="md"
              startColor="ink.900"
              endColor="ink.850"
            />
          ))}
        </SimpleGrid>
      </PageContainer>
    );
  }

  const author = list.userDisplayName || list.username || "Usuário";
  const count = list.items.length;
  const updated = list.updatedAt
    ? formatDistanceToNow(new Date(list.updatedAt), { locale: ptBR, addSuffix: true })
    : null;

  return (
    <>
      <SEO
        title={`${list.title} | SeasonScore`}
        description={list.description || `Lista de ${author}`}
      />

      <PageContainer py={{ base: 8, md: 12 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap">
          <Box maxW="720px">
            <HStack spacing={2}>
              <Text textStyle="label" color="ink.400">
                Lista · {count} {count === 1 ? "série" : "séries"}
              </Text>
              {!list.isPublic && (
                <HStack spacing={1} color="ink.400" fontSize="xs">
                  <Lock size={12} />
                  <Text>{list.accessByLink ? "Privada, acesso por link" : "Privada"}</Text>
                </HStack>
              )}
            </HStack>
            <Heading as="h1" size="h1" mt={2}>
              {list.title}
            </Heading>
            <HStack mt={3} spacing={2.5}>
              <UserAvatar
                size="xs"
                photoURL={list.userPhotoURL}
                name={author}
                userId={list.userId}
              />
              <Link
                as={RouterLink}
                to={`/u/${list.username || list.userId}`}
                fontSize="sm"
                fontWeight={500}
                color="ink.200"
                _hover={{ color: "signal.300", textDecoration: "none" }}
              >
                {author}
              </Link>
              {updated && (
                <Text fontSize="xs" color="ink.400" fontFamily="mono">
                  · atualizada {updated}
                </Text>
              )}
            </HStack>
            {list.description && (
              <Text mt={4} color="ink.200" whiteSpace="pre-wrap">
                {list.description}
              </Text>
            )}
            {list.tags && list.tags.length > 0 && (
              <Wrap mt={4} spacing={1.5}>
                {list.tags.map((tag) => (
                  <WrapItem key={tag}>
                    <Tag
                      as={RouterLink}
                      to={`/lists?tag=${encodeURIComponent(tag)}`}
                      size="sm"
                      _hover={{ color: "ink.50" }}
                    >
                      {tag}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </Box>

          {isOwner && (
            <HStack spacing={2}>
              <Button leftIcon={<Plus size={16} />} onClick={addSeries.onOpen}>
                Adicionar séries
              </Button>
              <Button variant="outline" leftIcon={<NotePencil size={16} />} onClick={edit.onOpen}>
                Editar
              </Button>
            </HStack>
          )}
        </Flex>

        <HStack
          mt={6}
          py={3}
          spacing={1}
          borderTop="1px solid"
          borderBottom="1px solid"
          borderColor="ink.800"
        >
          <Box px={2}>
            <ReactionButton
              likes={[]}
              onReaction={handleLikeToggle}
              tooltipText={isLiked ? "Descurtir lista" : "Curtir lista"}
              forcedLikeState={isLiked}
              forcedLikesCount={likesCount}
              isLoading={isTogglingLike}
            />
          </Box>
          <Button
            as="a"
            href="#comentarios"
            variant="ghost"
            size="sm"
            leftIcon={<ChatCircle size={16} />}
          >
            <Text as="span" fontFamily="mono">
              {commentsCount ?? list.commentsCount ?? 0}
            </Text>
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<Share size={16} />} onClick={handleShare}>
            Copiar link
          </Button>
        </HStack>

        <Box as="section" mt={8} aria-label="Séries da lista">
          {count === 0 ? (
            <EmptyState
              icon={ListBullets}
              title="Esta lista ainda não tem séries."
              description={
                isOwner ? "Busque e adicione as séries que fazem parte dela." : undefined
              }
              action={
                isOwner ? (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus size={14} />}
                    onClick={addSeries.onOpen}
                  >
                    Adicionar séries
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <SimpleGrid
              as="ol"
              listStyleType="none"
              columns={{ base: 3, sm: 4, md: 5, lg: 6 }}
              spacingX={{ base: 3, md: 4 }}
              spacingY={6}
            >
              {list.items.map((item, index) => (
                <Box as="li" key={item.seriesId} position="relative" role="group">
                  <SeriesCard
                    series={{
                      id: item.seriesId,
                      name: item.name,
                      poster_path: item.poster_path,
                      backdrop_path: null,
                      overview: "",
                      first_air_date: "",
                      vote_average: 0,
                    }}
                    size="lg"
                    position={index + 1}
                  />
                  {isOwner && (
                    <Tooltip label="Remover da lista" openDelay={300}>
                      <IconButton
                        aria-label={`Remover ${item.name} da lista`}
                        icon={<X size={14} />}
                        size="xs"
                        position="absolute"
                        bottom={{ base: "52px", md: "56px" }}
                        right={1.5}
                        zIndex={3}
                        bg="rgba(15,15,14,0.85)"
                        color="ink.100"
                        _hover={{ bg: "danger", color: "ink.50" }}
                        opacity={{ base: 1, md: 0 }}
                        _groupHover={{ opacity: 1 }}
                        _focus={{ opacity: 1 }}
                        onClick={() => {
                          setToRemove({ id: item.seriesId, name: item.name });
                          removeAlert.onOpen();
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Box as="section" id="comentarios" mt={12} scrollMarginTop="80px" maxW="760px">
          <CommentSection
            objectId={list.id}
            objectType="list"
            commentsCount={list.commentsCount || 0}
            onCommentsCountChange={setCommentsCount}
          />
        </Box>
      </PageContainer>

      {isOwner && (
        <>
          <EditListModal
            isOpen={edit.isOpen}
            onClose={edit.onClose}
            list={list}
            onListUpdated={(updated) => {
              setList((prev) =>
                prev
                  ? {
                      ...prev,
                      title: updated.title,
                      description: updated.description,
                      tags: updated.tags,
                      isPublic: updated.isPublic,
                      accessByLink: updated.accessByLink,
                    }
                  : prev
              );
              invalidateLists();
            }}
          />
          <AddSeriesModal
            isOpen={addSeries.isOpen}
            onClose={addSeries.onClose}
            existingIds={existingIds}
            onAdd={handleAdd}
          />
        </>
      )}

      <AlertDialog
        isOpen={removeAlert.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={removeAlert.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Remover da lista</AlertDialogHeader>
            <AlertDialogBody color="ink.200">
              Remover <strong>{toRemove?.name}</strong> desta lista?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} variant="ghost" onClick={removeAlert.onClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" ml={3} isLoading={isRemoving} onClick={handleRemove}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
