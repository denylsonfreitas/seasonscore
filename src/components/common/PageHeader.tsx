import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  Button,
  HStack,
  VStack,
  Flex,
  useBreakpointValue,
} from "@chakra-ui/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  tabs?: Array<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
  }>;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onSearchSubmit?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchValue?: string;
  actionButton?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  tabs,
  showSearch = false,
  searchPlaceholder = "Buscar...",
  onSearch,
  onSearchSubmit,
  searchValue = "",
  actionButton,
}: PageHeaderProps) {
  // Detectar se estamos em mobile
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box 
      bgGradient="linear(to-b, gray.800, gray.900)" 
      py={8}
      position="relative"
    >
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={6}>
          {/* Título e Subtítulo */}
          <Box>
            <Heading color="white" size="2xl" mb={2}>
              {title}
            </Heading>
            {subtitle && (
              <Text color="gray.400" fontSize="lg">
                {subtitle}
              </Text>
            )}
          </Box>

          {/* Layout adaptável para tabs e busca */}
          <VStack spacing={4} align="stretch">
            {/* Se tiver tabs, mostra-as primeiro */}
            {tabs && tabs.length > 0 && (
              <Tabs variant="line" colorScheme="primary" width="100%">
                <TabList borderBottomColor="gray.700" overflowX="auto" pb={1}>
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      color="gray.400"
                      _selected={{
                        color: "primary.500",
                        borderColor: "primary.500",
                      }}
                      onClick={tab.onClick}
                      _active={{
                        color: "primary.500",
                        borderColor: "primary.500",
                      }}
                      minWidth={isMobile ? "auto" : "100px"}
                      px={3}
                      py={2}
                      fontSize={isMobile ? "sm" : "md"}
                      whiteSpace="nowrap"
                    >
                      {tab.label}
                    </Tab>
                  ))}
                </TabList>
              </Tabs>
            )}
            
            {/* Barra de busca e botão de ação */}
            {(showSearch || actionButton) && (
              <Flex 
                justify="space-between" 
                align="center"
                flexWrap={{ base: "wrap", md: "nowrap" }}
                gap={3}
                mt={tabs && tabs.length > 0 ? 2 : 0}
              >
                {showSearch && (
                  <InputGroup flex={{ base: actionButton ? "1 0 100%" : "1", md: "1" }} 
                    maxW={{ base: "100%", md: actionButton ? "500px" : "100%" }}
                    mb={{ base: actionButton ? 2 : 0, md: 0 }}
                  >
                    <Input
                      placeholder={searchPlaceholder}
                      bg="gray.700"
                      border="none"
                      _focus={{
                        boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)",
                        borderColor: "primary.500",
                      }}
                      value={searchValue}
                      onChange={(e) => onSearch?.(e.target.value)}
                      onKeyDown={onSearchSubmit}
                      size={isMobile ? "md" : "md"}
                    />
                    <InputRightElement>
                      <Icon as={MagnifyingGlass} color="gray.400" weight="bold" />
                    </InputRightElement>
                  </InputGroup>
                )}
                
                {actionButton && (
                  <Box flex="0 0 auto" alignSelf={{ base: "flex-end", md: "center" }}>
                    {actionButton}
                  </Box>
                )}
              </Flex>
            )}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
} 