import React from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  Flex,
  Tag,
  TagLabel,
  Icon,
  Wrap,
  WrapItem,
  Image,
  useColorModeValue
} from '@chakra-ui/react';
import { FaHeart, FaComment } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/dateUtils';
import { UserAvatar } from '../common/UserAvatar';
import { ListWithUserData } from '../../types/list';

interface ListCardProps {
  list: ListWithUserData;
  showUser?: boolean;
}

export function ListCard({ list, showUser = true }: ListCardProps) {
  const coverBg = useColorModeValue('gray.700', 'gray.700');
  
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      role="group"
      as={RouterLink}
      to={`/list/${list.id}`}
    >
      {/* Capa da lista - usamos a primeira série da lista como capa */}
      <Box 
        h="140px" 
        bg={coverBg} 
        position="relative"
        overflow="hidden"
      >
        {list.coverImage ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${list.coverImage}`}
            alt={list.title}
            w="100%"
            h="100%"
            objectFit="cover"
            transition="transform 0.3s ease"
            _groupHover={{ transform: 'scale(1.05)' }}
            opacity={0.7}
          />
        ) : (
          <Flex 
            align="center" 
            justify="center" 
            h="100%" 
            color="gray.400"
            fontSize="lg"
            fontStyle="italic"
          >
            Sem imagem
          </Flex>
        )}
        
        {/* Informações do criador da lista */}
        {showUser && (
          <HStack 
            position="absolute" 
            bottom={2} 
            left={2} 
            spacing={2}
            bg="blackAlpha.700"
            p={1}
            px={2}
            borderRadius="md"
          >
            <UserAvatar 
              size="xs" 
              photoURL={list.userPhotoURL}
              name={list.userDisplayName}
              userId={list.userId}
            />
            <Text fontSize="xs" color="white" fontWeight="medium">
              {list.userDisplayName}
            </Text>
          </HStack>
        )}
      </Box>
      
      {/* Conteúdo */}
      <Box p={4}>
        <Heading size="md" color="white" noOfLines={1} mb={2}>
          {list.title}
        </Heading>
        
        <Text color="gray.400" fontSize="sm" noOfLines={2} mb={3} minH="40px">
          {list.description || "Sem descrição"}
        </Text>
        
        {/* Tags */}
        {list.tags && list.tags.length > 0 && (
          <Wrap spacing={2} mb={3}>
            {list.tags.slice(0, 3).map(tag => (
              <WrapItem key={tag}>
                <Tag size="sm" colorScheme="primary" variant="subtle">
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              </WrapItem>
            ))}
            {list.tags.length > 3 && (
              <WrapItem>
                <Tag size="sm" colorScheme="gray" variant="subtle">
                  <TagLabel>+{list.tags.length - 3}</TagLabel>
                </Tag>
              </WrapItem>
            )}
          </Wrap>
        )}
        
        {/* Estatísticas e data */}
        <Flex justifyContent="space-between" alignItems="center" mt={2}>
          <HStack spacing={4} color="gray.400" fontSize="sm">
            <HStack spacing={1}>
              <Icon as={FaHeart} color="red.500" />
              <Text>{list.likesCount}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FaComment} />
              <Text>{list.commentsCount}</Text>
            </HStack>
          </HStack>
          
          <Text fontSize="xs" color="gray.500">
            {formatRelativeTime(list.updatedAt)}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
} 