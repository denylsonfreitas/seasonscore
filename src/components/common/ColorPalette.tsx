import { Box, SimpleGrid, Text, VStack, Heading, useTheme } from "@chakra-ui/react";

/**
 * Componente para exibir a paleta de cores do sistema
 * Útil para documentação e referência visual durante o desenvolvimento
 */
export function ColorPalette() {
  const theme = useTheme();
  
  // Extrair as cores do tema do Chakra UI
  const { colors } = theme;
  
  // Definir as categorias de cores que queremos exibir
  const colorCategories = [
    { name: "Primary", key: "primary" },
    { name: "Secondary", key: "secondary" }
  ];
  
  // Cores de estado
  const stateColors = [
    { name: "Success", key: "success" },
    { name: "Warning", key: "warning" },
    { name: "Error", key: "error" },
    { name: "Info", key: "info" }
  ];

  // Cores de reações
  const reactionColors = [
    { name: "Like", key: "reactions.like" },
    { name: "Dislike", key: "reactions.dislike" }
  ];

  return (
    <VStack spacing={8} align="stretch" p={6}>
      <Heading as="h1" size="xl" mb={4}>
        Sistema de Cores do SeasonScore
      </Heading>
      
      <Text fontSize="lg" mb={4}>
        Esta é a paleta de cores oficial do SeasonScore. Use estas cores para manter a consistência visual em toda a aplicação.
      </Text>
      
      {/* Cores primárias e secundárias com seus tons */}
      {colorCategories.map((category) => (
        <Box key={category.key} mb={6}>
          <Heading as="h2" size="md" mb={2}>
            {category.name}
          </Heading>
          
          <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4}>
            {Object.keys(colors[category.key] || {})
              .filter(shade => !isNaN(Number(shade)))
              .map((shade) => (
                <VStack key={shade} align="stretch" spacing={0}>
                  <Box 
                    height="80px" 
                    bg={`${category.key}.${shade}`} 
                    borderRadius="md"
                    boxShadow="md"
                  />
                  <Box bg="gray.800" p={2} borderRadius="md" mt={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      {category.key}.{shade}
                    </Text>
                    <Text fontSize="xs" color="gray.300">
                      {colors[category.key][shade]}
                    </Text>
                  </Box>
                </VStack>
              ))}
          </SimpleGrid>
        </Box>
      ))}
      
      {/* Cores de estado */}
      <Box mb={6}>
        <Heading as="h2" size="md" mb={2}>
          Cores de Estado
        </Heading>
        
        <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={4}>
          {stateColors.map((color) => (
            <VStack key={color.key} align="stretch" spacing={0}>
              <Box 
                height="80px" 
                bg={color.key}
                borderRadius="md"
                boxShadow="md"
              />
              <Box bg="gray.800" p={2} borderRadius="md" mt={1}>
                <Text fontSize="sm" fontWeight="bold">
                  {color.name}
                </Text>
                <Text fontSize="xs" color="gray.300">
                  {colors[color.key]}
                </Text>
              </Box>
            </VStack>
          ))}
        </SimpleGrid>
      </Box>
      
      {/* Cores de reações */}
      <Box mb={6}>
        <Heading as="h2" size="md" mb={2}>
          Cores de Reações
        </Heading>
        
        <SimpleGrid columns={{ base: 2, sm: 2, md: 2 }} spacing={4}>
          {reactionColors.map((color) => (
            <VStack key={color.key} align="stretch" spacing={0}>
              <Box 
                height="80px" 
                bg={color.key}
                borderRadius="md"
                boxShadow="md"
              />
              <Box bg="gray.800" p={2} borderRadius="md" mt={1}>
                <Text fontSize="sm" fontWeight="bold">
                  {color.name}
                </Text>
                <Text fontSize="xs" color="gray.300">
                  {color.key === "reactions.like" ? colors.reactions.like : colors.reactions.dislike}
                </Text>
              </Box>
            </VStack>
          ))}
        </SimpleGrid>
      </Box>
      
      <Text fontSize="sm" color="gray.500" mt={4}>
        Consulte a documentação em src/styles/README.md para instruções detalhadas sobre como usar esse sistema de cores.
      </Text>
    </VStack>
  );
} 