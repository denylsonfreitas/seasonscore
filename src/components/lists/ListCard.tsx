import {
  Box,
  Flex,
  Heading,
  HStack,
  LinkBox,
  LinkOverlay,
  Text,
  Wrap,
  WrapItem,
  Tag,
} from "@chakra-ui/react";
import { ChatCircle, Heart, Lock } from "@phosphor-icons/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import type React from "react";
import type { ListWithUserData } from "../../types/list";
import { UserAvatar } from "../common/UserAvatar";
import { EnhancedImage } from "../common/EnhancedImage";

interface ListCardProps {
  list: ListWithUserData;
  showUser?: boolean;
}

const COVER_POSTERS = 5;

/** Lista: pôsteres sobrepostos, título, autor, descrição e números. */
export function ListCard({ list, showUser = true }: ListCardProps) {
  const navigate = useNavigate();
  const items = list.items ?? [];
  const count = items.length;
  const author = list.userDisplayName || list.username;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/lists?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <LinkBox
      as="article"
      h="100%"
      display="flex"
      flexDirection="column"
      bg="ink.900"
      border="1px solid"
      borderColor="ink.800"
      borderRadius="md"
      overflow="hidden"
      transition="border-color 120ms ease"
      _hover={{ borderColor: "ink.600" }}
    >
      {/* capa: pôsteres lado a lado, levemente sobrepostos */}
      <Flex h="148px" px={4} pt={4} bg="ink.850" align="flex-end" overflow="hidden">
        {count > 0 ? (
          items.slice(0, COVER_POSTERS).map((item, i) => (
            <Box
              key={item.seriesId}
              flex="0 0 auto"
              w="84px"
              aspectRatio={2 / 3}
              ml={i === 0 ? 0 : "-28px"}
              zIndex={COVER_POSTERS - i}
              borderTopRadius="sm"
              overflow="hidden"
              bg="ink.800"
              boxShadow="4px 0 12px rgba(0,0,0,0.5)"
              alignSelf="flex-start"
            >
              {item.poster_path && (
                <EnhancedImage
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                  alt=""
                  tmdbWidth="w185"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              )}
            </Box>
          ))
        ) : (
          <Text alignSelf="center" mb={10} fontSize="sm" color="ink.400">
            Lista vazia
          </Text>
        )}
      </Flex>

      <Flex direction="column" flex={1} p={4} gap={2}>
        <Flex align="center" gap={2}>
          <LinkOverlay as={RouterLink} to={`/list/${list.id}`} flex={1} minW={0}>
            <Heading as="h3" size="h3" fontSize="md" noOfLines={1}>
              {list.title}
            </Heading>
          </LinkOverlay>
          {!list.isPublic && (
            <Box color="ink.400" title="Lista privada" aria-label="Lista privada">
              <Lock size={14} />
            </Box>
          )}
        </Flex>

        {showUser && author && (
          <HStack spacing={2}>
            <UserAvatar size="xs" photoURL={list.userPhotoURL} name={author} userId={list.userId} />
            <Text fontSize="sm" color="ink.300" noOfLines={1}>
              {author}
            </Text>
          </HStack>
        )}

        {list.description && (
          <Text fontSize="sm" color="ink.300" noOfLines={2}>
            {list.description}
          </Text>
        )}

        {list.tags && list.tags.length > 0 && (
          <Wrap spacing={1.5} position="relative" zIndex={1}>
            {list.tags.slice(0, 3).map((tag) => (
              <WrapItem key={tag}>
                <Tag
                  as="button"
                  size="sm"
                  onClick={(e: React.MouseEvent) => handleTagClick(e, tag)}
                  _hover={{ color: "ink.50" }}
                >
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}

        <HStack mt="auto" pt={2} spacing={4} fontFamily="mono" fontSize="xs" color="ink.400">
          <Text>
            {count} {count === 1 ? "série" : "séries"}
          </Text>
          <HStack spacing={1} aria-label={`${list.likesCount || 0} curtidas`}>
            <Heart size={13} />
            <Text>{list.likesCount || 0}</Text>
          </HStack>
          <HStack spacing={1} aria-label={`${list.commentsCount || 0} comentários`}>
            <ChatCircle size={13} />
            <Text>{list.commentsCount || 0}</Text>
          </HStack>
        </HStack>
      </Flex>
    </LinkBox>
  );
}
