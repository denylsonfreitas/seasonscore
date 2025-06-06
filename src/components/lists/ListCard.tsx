import React, { useEffect } from 'react';
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
  useColorModeValue,
  Stack,
  Tooltip
} from '@chakra-ui/react';
import { FaHeart, FaComment } from 'react-icons/fa';
import { Globe, Lock } from '@phosphor-icons/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/dateUtils';
import { UserAvatar } from '../common/UserAvatar';
import { ListWithUserData } from '../../types/list';
import { useQuery } from '@tanstack/react-query';
import { getListById } from '../../services/lists';
import { useAuth } from '../../contexts/AuthContext';
import { EnhancedImage } from '../common/EnhancedImage';
import { UserName } from '../common/UserName';

interface ListCardProps {
  list: ListWithUserData;
  showUser?: boolean;
}

export function ListCard({ list, showUser = true }: ListCardProps) {
  const coverBg = useColorModeValue('gray.700', 'gray.700');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Usar React Query para obter atualizações em tempo real
  const { data: updatedList, refetch } = useQuery({
    queryKey: ['list', list.id],
    queryFn: () => getListById(list.id),
    initialData: list,
    staleTime: 1000, // Reduzir para 1 segundo (era 5000)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Reduzir para 5 segundos (era 10000)
    refetchIntervalInBackground: false,
  });
  
  // Forçar uma atualização quando o componente for montado e quando
  // o usuário interagir com o cartão
  useEffect(() => {
    refetch();
    
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        refetch();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);

  // Usar os dados atualizados da lista, se disponíveis
  const displayList = updatedList || list;
  
  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/lists?tag=${encodeURIComponent(tag)}&source=listPage&tab=1`);
  };
  
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      role="group"
      as={RouterLink}
      to={`/list/${displayList.id}`}
      h="100%"
      display="flex"
      flexDirection="column"
    >
      {/* Capa da lista - mostra imagens empilhadas horizontalmente como álbum */}
      <Box 
        h="160px" 
        bg={coverBg} 
        position="relative"
        overflow="hidden"
        flexShrink={0}
      >
        {displayList.items && displayList.items.length > 0 ? (
          <Flex 
            align="center" 
            justify="flex-start" 
            h="100%" 
            w="100%"
            position="relative"
            px={4}
          >
            {/* Renderiza até 4 imagens empilhadas horizontalmente */}
            {displayList.items.slice(0, 4).map((item, index) => (
              <Box
                key={item.seriesId}
                position="absolute"
                height="85%"
                width="22%"
                left={`${8 + index * 17}%`}
                zIndex={4 - index}
                boxShadow="lg"
                borderRadius="md"
                overflow="hidden"
                transform={`translateX(0) translateY(0) scale(${1 - index * 0.05})`}
                transition="all 0.3s ease"
                _groupHover={{
                  transform: `translateX(${index * 3}px) translateY(-${index * 2}px) scale(${1 - index * 0.05})`,
                }}
              >
                <EnhancedImage
                  src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://placehold.co/200x300/222222/FFFFFF?text=Sem+Imagem'}
                  alt={item.name}
                  tmdbWidth="w200"
                  style={{
                    opacity: 1 - (index * 0.12),
                    transition: "all 0.3s ease"
                  }}
                />
              </Box>
            ))}
            
            {/* Indicador de quantidade de séries na lista */}
            {displayList.items.length > 4 && (
              <Box
                position="absolute"
                bottom="10%"
                right="10%"
                bg="blackAlpha.800"
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="xs"
                fontWeight="bold"
                zIndex={10}
              >
                +{displayList.items.length - 4} séries
              </Box>
            )}
            
            {/* Sobreposição escura para melhorar a legibilidade do texto */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.300"
              zIndex={5}
            />
          </Flex>
        ) : (
          <Flex 
            align="center" 
            justify="center" 
            h="100%" 
            color="gray.400"
            fontSize="lg"
            fontStyle="italic"
          >
            Sem séries
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
            borderRadius="xl"
            zIndex={10}
          >
            <UserAvatar 
              size="xs" 
              photoURL={displayList.userPhotoURL}
              name={displayList.userDisplayName}
              userId={displayList.userId}
            />
            <UserName userId={displayList.userId} isLink={false} />
          </HStack>
        )}
      </Box>
      
      {/* Conteúdo */}
      <Box p={4} flex="1" display="flex" flexDirection="column">
        <Flex align="center" mb={2}>
          <Heading size="md" color="white" noOfLines={1} mr={2} flex="1">
            {displayList.title}
          </Heading>
          <Tooltip 
            label={displayList.isPublic 
              ? "Lista pública" 
              : displayList.accessByLink 
                ? "Lista privada com link compartilhável" 
                : "Lista privada"}
            placement="top"
            hasArrow
          >
            <Box 
              color={displayList.isPublic 
                ? "green.400" 
                : displayList.accessByLink 
                  ? "blue.400" 
                  : "gray.400"} 
              bg="gray.700" 
              p={1} 
              borderRadius="md" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              ml={1}
              flexShrink={0}
            >
              <Icon 
                as={displayList.isPublic 
                  ? Globe 
                  : Lock} 
                weight={displayList.accessByLink && !displayList.isPublic ? "duotone" : "fill"}
                boxSize={4}
              />
            </Box>
          </Tooltip>
        </Flex>
        
        <Text color="gray.400" fontSize="sm" noOfLines={2} minH="40px" mb={2}>
          {displayList.description || "Sem descrição"}
        </Text>
        
        {/* Tags */}
        <Box flex="1">
          {displayList.tags && displayList.tags.length > 0 && (
            <Wrap spacing={2} mb={3}>
              {displayList.tags.slice(0, 3).map(tag => (
                <WrapItem key={tag}>
                  <Tag 
                    size="sm" 
                    colorScheme="primary"
                    variant="subtle"
                    _hover={{ bg: 'primary.400', color: 'white' }}
                    onClick={(e) => handleTagClick(e, tag)}
                    cursor="pointer"
                  >
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
              {displayList.tags.length > 3 && (
                <WrapItem>
                  <Tag size="sm" colorScheme="gray" variant="subtle">
                    <TagLabel>+{displayList.tags.length - 3}</TagLabel>
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          )}
        </Box>
        
        {/* Estatísticas */}
        <HStack mt={1} spacing={4} color="gray.400">
          <HStack spacing={1} fontSize="sm">
            <Icon as={FaHeart} color={(displayList.likesCount || 0) > 0 ? "red.500" : "gray.500"} />
            <Text>{displayList.likesCount || 0}</Text>
          </HStack>
          
          <HStack spacing={1} fontSize="sm">
            <Icon as={FaComment} color={(displayList.commentsCount || 0) > 0 ? "blue.500" : "gray.500"} />
            <Text>{displayList.commentsCount || 0}</Text>
          </HStack>
          
          <Text fontSize="xs" color="gray.500" ml="auto">
            {formatRelativeTime(displayList.updatedAt)}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
} 