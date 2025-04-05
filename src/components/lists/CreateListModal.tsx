import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Box,
  Flex,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  VStack,
  Icon
} from '@chakra-ui/react';
import { Globe, Lock } from '@phosphor-icons/react';
import { createList } from '../../services/lists';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListCreated?: (listId: string) => void;
  initialSeries?: {
    id: number;
    name: string;
    poster_path: string | null;
  };
}

export function CreateListModal({ 
  isOpen, 
  onClose, 
  onListCreated,
  initialSeries 
}: CreateListModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [accessByLink, setAccessByLink] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (tags.length >= 10) {
        toast({
          title: 'Limite de tags',
          description: 'Você pode adicionar no máximo 10 tags',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateList = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, forneça um título para a lista',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Criar a lista com ou sem a série inicial
      const initialItems = initialSeries ? [{
        seriesId: initialSeries.id,
        name: initialSeries.name,
        poster_path: initialSeries.poster_path,
        addedAt: new Date()
      }] : [];
      
      const listId = await createList(
        title.trim(),
        description.trim(),
        tags,
        isPublic,
        initialItems,
        accessByLink
      );
      
      toast({
        title: 'Lista criada',
        description: initialSeries 
          ? `Lista criada com "${initialSeries.name}" adicionada` 
          : 'Lista criada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Limpar o formulário
      resetForm();
      
      // Fechar o modal
      onClose();
      
      // Informar ao componente pai que a lista foi criada
      if (onListCreated) {
        onListCreated(listId);
      }
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a lista. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setAccessByLink(false);
    setTags([]);
    setTagInput('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Criar Nova Lista</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {initialSeries && (
              <Box 
                p={3} 
                bg="gray.700" 
                borderRadius="md" 
                mb={4}
              >
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  A série abaixo será adicionada à nova lista:
                </Text>
                <Flex align="center" gap={3}>
                  {initialSeries.poster_path && (
                    <Box 
                      width="40px" 
                      height="60px" 
                      borderRadius="md" 
                      overflow="hidden"
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${initialSeries.poster_path}`}
                        alt={initialSeries.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  <Text fontWeight="bold" color="white">
                    {initialSeries.name}
                  </Text>
                </Flex>
              </Box>
            )}
            
            <FormControl isRequired>
              <FormLabel>Título</FormLabel>
              <Input
                placeholder="Nome da lista"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                placeholder="Descrição opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Flex mb={2}>
                <Input
                  placeholder="Adicione tags e pressione Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  mr={2}
                  bg="gray.700"
                  borderColor="gray.600"
                />
                <Button 
                  onClick={handleAddTag}
                  colorScheme="primary"
                >
                  Adicionar
                </Button>
              </Flex>
              
              <Flex wrap="wrap" gap={2} mt={2}>
                {tags.map(tag => (
                  <Tag key={tag} colorScheme="primary" size="md">
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                  </Tag>
                ))}
              </Flex>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="is-public" mb="0">
                <Flex align="center">
                  <Icon as={isPublic ? Globe : Lock} weight="fill" mr={2} color={isPublic ? "green.400" : "gray.400"} />
                  {isPublic ? "Pública" : "Privada"}
                </Flex>
              </FormLabel>
              <Switch
                id="is-public"
                isChecked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  // Se tornar pública, desativa o acesso por link
                  if (e.target.checked) {
                    setAccessByLink(false);
                  }
                }}
                colorScheme="primary"
              />
            </FormControl>

            {/* Opção de acesso por link - aparece apenas quando a lista é privada */}
            {!isPublic && (
              <FormControl display="flex" alignItems="center" mt={2} pl={6}>
                <FormLabel htmlFor="access-by-link" mb="0" fontSize="sm">
                  <Flex align="center">
                    <Icon as={accessByLink ? Globe : Lock} weight="fill" mr={2} color={accessByLink ? "blue.400" : "gray.400"} size={14} />
                    Permitir acesso por link
                  </Flex>
                </FormLabel>
                <Switch
                  id="access-by-link"
                  isChecked={accessByLink}
                  onChange={(e) => setAccessByLink(e.target.checked)}
                  colorScheme="blue"
                  size="sm"
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            color="gray.400"
            _hover={{ bg: "gray.700" }}
          >
            Cancelar
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleCreateList}
            isLoading={isSubmitting}
            loadingText="Criando..."
          >
            Criar Lista
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 