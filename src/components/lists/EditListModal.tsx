import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Switch,
  FormHelperText,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { List } from '../../types/list';
import { updateList } from '../../services/lists';
import { useAuth } from '../../contexts/AuthContext';

interface EditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: List;
  onListUpdated: (list: List) => void;
}

export function EditListModal({ isOpen, onClose, list, onListUpdated }: EditListModalProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || '');
  const [isPublic, setIsPublic] = useState(list.isPublic !== false); // Default to true if not specified
  const [tags, setTags] = useState<string[]>(list.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initialRef = useRef<HTMLInputElement>(null);

  const handleTagAdd = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      // Manter apenas tags únicas
      if (tags.length >= 10) {
        toast({
          title: 'Limite de tags',
          description: 'Você pode adicionar no máximo 10 tags por lista',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Limitar o tamanho da tag
      if (trimmedTag.length > 20) {
        toast({
          title: 'Tag muito longa',
          description: 'Tags devem ter no máximo 20 caracteres',
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

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    if (title.trim().length < 3) {
      toast({
        title: 'Título muito curto',
        description: 'O título da lista deve ter pelo menos 3 caracteres',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const updatedListData = {
        title: title.trim(),
        description: description.trim(),
        tags,
        isPublic,
      };
      
      await updateList(list.id, updatedListData);
      
      onListUpdated({
        ...list,
        ...updatedListData
      });
      
      toast({
        title: 'Lista atualizada',
        description: 'Suas alterações foram salvas com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a lista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialRef}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Editar Lista</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Título</FormLabel>
              <Input
                ref={initialRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da lista"
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional"
                resize="vertical"
                rows={3}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <InputGroup size="md">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Adicionar tag"
                  pr="4.5rem"
                  bg="gray.700"
                  borderColor="gray.600"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    aria-label="Adicionar tag"
                    icon={<FaPlus />}
                    onClick={handleTagAdd}
                    isDisabled={!tagInput.trim()}
                    colorScheme="primary"
                  />
                </InputRightElement>
              </InputGroup>
              <FormHelperText>
                Pressione Enter ou clique no ícone para adicionar tags (máx. 10)
              </FormHelperText>
              
              {tags.length > 0 && (
                <Flex wrap="wrap" mt={2} gap={2}>
                  {tags.map((tag, index) => (
                    <Tag
                      size="md"
                      key={index}
                      borderRadius="full"
                      variant="solid"
                      colorScheme="primary"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleTagRemove(tag)} />
                    </Tag>
                  ))}
                </Flex>
              )}
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibility" mb="0">
                Privacidade
              </FormLabel>
              <Switch
                id="visibility"
                isChecked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                colorScheme="primary"
              />
              <FormHelperText ml={2}>
                {isPublic 
                  ? 'Listas públicas são visíveis para todos os usuários'
                  : 'Listas privadas são visíveis apenas para você'}
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading} color="white" _hover={{ bg: "gray.700" }}>
            Cancelar
          </Button>
          <Button 
            colorScheme="primary" 
            onClick={handleSubmit} 
            isLoading={isLoading}
            loadingText="Salvando..."
          >
            Salvar alterações
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 