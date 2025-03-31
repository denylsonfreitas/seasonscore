import React from 'react';
import { Box, Heading, Text, HStack, VStack, Badge, useColorModeValue, Flex } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ListWithUserData } from '../../types/list';
import { UserAvatar } from '../common/UserAvatar';
import { formatRelativeTime } from '../../utils/dateUtils';
import { FaHeart, FaComment } from 'react-icons/fa';

interface ListCardProps {
  list: ListWithUserData;
  showUser?: boolean;
}

export function ListCard({ list, showUser = true }: ListCardProps) {
  const { 
    id, 
    title, 
    description, 
    items, 
    tags, 
    likesCount, 
    commentsCount, 
    createdAt, 
    userId, 
    username,
    userPhotoURL,
    userDisplayName
  } = list;

  // Cores do tema
  const bgColor = useColorModeValue('secondary.800', 'secondary.700');
  const bgHoverColor = useColorModeValue('secondary.700', 'secondary.600');
  const borderColor = useColorModeValue('primary.500', 'primary.400');
  const textColor = useColorModeValue('white', 'white');
  const subtextColor = useColorModeValue('secondary.300', 'secondary.300');
  const timeColor = useColorModeValue('secondary.400', 'secondary.400');

  // Mostrar no máximo 3 séries da lista
  const displayItems = items.slice(0, 3);
  const remainingCount = Math.max(0, items.length - 3);

  // Calcular o tempo relativo (ex: "há 2 horas")
  const timeAgo = formatRelativeTime(createdAt);

  return (
    <Box
      as={RouterLink}
      to={`/lists/${id}`}
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      p={4}
      _hover={{
        borderColor: 'primary.500',
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)'
      }}
      transition="all 0.2s ease-in-out"
      shadow="md"
      w="100%"
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={3}>
        {/* Informações do usuário */}
        {showUser && (
          <Flex align="center" mb={2}>
            <UserAvatar
              userId={userId}
              photoURL={userPhotoURL}
              name={userDisplayName}
              size="sm"
            />
            <Text ml={2} fontWeight="medium" fontSize="sm" color={textColor}>
              {username ? `@${username}` : userDisplayName || "Usuário"}
            </Text>
            <Text ml={2} fontSize="xs" color={timeColor}>
              • {timeAgo}
            </Text>
          </Flex>
        )}

        {/* Título e descrição */}
        <Box>
          <Heading size="md" noOfLines={1} color={textColor}>
            {title}
          </Heading>
          <Text fontSize="sm" color={subtextColor} noOfLines={2} mt={1}>
            {description || "Sem descrição"}
          </Text>
        </Box>

        {/* Cards das séries (limite de 3) */}
        <HStack spacing={2} overflowX="auto" pb={2} css={{ 
          '&::-webkit-scrollbar': { display: 'none' },
          'scrollbarWidth': 'none'
        }}>
          {displayItems.map((item, index) => (
            <Box
              key={item.seriesId}
              w="80px"
              h="120px"
              borderRadius="md"
              overflow="hidden"
              position="relative"
              flexShrink={0}
              style={{
                transform: `rotate(${(index - 1) * 3}deg)`,
                transformOrigin: 'bottom',
                zIndex: 3 - index
              }}
              borderWidth="1px"
              borderColor="primary.500"
            >
              <Box
                bgImage={item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : 'none'}
                bgSize="cover"
                bgPosition="center"
                w="100%"
                h="100%"
                bg={item.poster_path ? undefined : 'secondary.600'}
              />
              {!item.poster_path && (
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  fontSize="xs"
                  textAlign="center"
                  fontWeight="bold"
                  color={textColor}
                >
                  {item.name}
                </Text>
              )}
            </Box>
          ))}
          
          {remainingCount > 0 && (
            <Box
              w="80px"
              h="120px"
              borderRadius="md"
              bg="secondary.600"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              position="relative"
              style={{
                transform: 'rotate(3deg)',
                transformOrigin: 'bottom'
              }}
              borderWidth="1px"
              borderColor="primary.500"
            >
              <Text fontWeight="bold" color={textColor}>+{remainingCount}</Text>
            </Box>
          )}
        </HStack>

        {/* Tags e estatísticas */}
        <Flex justify="space-between" align="center">
          <HStack spacing={2} flexWrap="wrap" flex="1" overflow="hidden">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} colorScheme="primary" fontSize="10px">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge colorScheme="gray" fontSize="10px">
                +{tags.length - 3}
              </Badge>
            )}
          </HStack>
          
          <HStack spacing={3}>
            <HStack spacing={1} color="primary.300">
              <FaComment size={14} />
              <Text fontSize="sm">{commentsCount}</Text>
            </HStack>
            <HStack spacing={1} color="primary.300">
              <FaHeart size={14} />
              <Text fontSize="sm">{likesCount}</Text>
            </HStack>
          </HStack>
        </Flex>
      </VStack>
    </Box>
  );
} 