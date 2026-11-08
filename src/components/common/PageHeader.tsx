import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
} from "@chakra-ui/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type React from "react";
import { PageContainer } from "../layout/PageContainer";

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

/** Cabeçalho das páginas de seção: título, descrição curta, abas e busca. */
export function PageHeader({
  title,
  subtitle,
  tabs,
  showSearch = false,
  searchPlaceholder = "Buscar",
  onSearch,
  onSearchSubmit,
  searchValue = "",
  actionButton,
}: PageHeaderProps) {
  return (
    <PageContainer pt={{ base: 8, md: 12 }} pb={{ base: 4, md: 6 }}>
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "flex-end" }}
        gap={4}
        wrap="wrap"
      >
        <Box maxW="640px">
          <Heading as="h1" size="h1">
            {title}
          </Heading>
          {subtitle && (
            <Text mt={2} color="ink.300" fontSize={{ base: "md", md: "lg" }}>
              {subtitle}
            </Text>
          )}
        </Box>
        {actionButton && <Box flexShrink={0}>{actionButton}</Box>}
      </Flex>

      {showSearch && (
        <InputGroup mt={6} maxW={{ base: "100%", md: "480px" }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={MagnifyingGlass} color="ink.400" boxSize={4} />
          </InputLeftElement>
          <Input
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            onKeyDown={onSearchSubmit}
          />
        </InputGroup>
      )}

      {tabs && tabs.length > 0 && (
        <Flex
          role="tablist"
          mt={showSearch ? 6 : 8}
          borderBottom="1px solid"
          borderColor="ink.800"
          gap={{ base: 4, md: 6 }}
          overflowX="auto"
          sx={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          {tabs.map((tab) => (
            <Box
              as="button"
              type="button"
              role="tab"
              aria-selected={tab.isSelected}
              key={tab.label}
              onClick={tab.onClick}
              py={3}
              mb="-1px"
              fontSize="sm"
              fontWeight={tab.isSelected ? 600 : 500}
              color={tab.isSelected ? "ink.50" : "ink.300"}
              borderBottom="2px solid"
              borderColor={tab.isSelected ? "signal.400" : "transparent"}
              whiteSpace="nowrap"
              transition="color 120ms ease"
              _hover={{ color: "ink.50" }}
            >
              {tab.label}
            </Box>
          ))}
        </Flex>
      )}
    </PageContainer>
  );
}
