import {
  Box,
  Heading,
  Flex,
  Button,
  Text,
  Spinner,
  Grid,
  BoxProps,
  HeadingProps,
  ButtonProps,
  GridProps,
} from "@chakra-ui/react";
import React, { ReactNode, useState } from "react";
import { CaretRight, CaretDown, CaretUp } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";

export interface SectionBaseProps {
  title: string;
  link?: string;
  linkText?: string;
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  loadingElement?: ReactNode;
  errorElement?: ReactNode;
  emptyElement?: ReactNode;
  expandable?: boolean;
  initialExpanded?: boolean;
  expandThreshold?: number;
  containerProps?: BoxProps;
  gridProps?: GridProps;
  headerProps?: BoxProps;
  titleProps?: HeadingProps;
  linkButtonProps?: ButtonProps;
  renderExpandButton?: (isExpanded: boolean, toggleExpand: () => void) => ReactNode;
  renderContent: (limitItems: boolean) => ReactNode;
  children?: ReactNode;
}

export function SectionBase({
  title,
  link,
  linkText = "Ver todas",
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = "Nenhum conteúdo encontrado",
  loadingElement,
  errorElement,
  emptyElement,
  expandable = false,
  initialExpanded = false,
  expandThreshold = 6,
  containerProps,
  gridProps,
  headerProps,
  titleProps,
  linkButtonProps,
  renderExpandButton,
  renderContent,
  children,
}: SectionBaseProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Renderização personalizada ou padrão de elementos de estado
  const renderLoadingState = () => {
    if (loadingElement) return loadingElement;
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="primary.500" />
      </Box>
    );
  };

  const renderErrorState = () => {
    if (errorElement) return errorElement;
    return (
      <Box textAlign="center" py={8}>
        <Text color="red.500">
          Erro ao carregar conteúdo: {error?.message || "Erro desconhecido"}
        </Text>
      </Box>
    );
  };

  const renderEmptyState = () => {
    if (emptyElement) return emptyElement;
    return (
      <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
        <Text color="gray.400">{emptyMessage}</Text>
      </Box>
    );
  };

  // Renderização do botão de expansão padrão
  const defaultExpandButton = (
    <Flex justify="center" mt={6}>
      <Button
        variant="ghost"
        colorScheme="whiteAlpha"
        onClick={toggleExpand}
        rightIcon={isExpanded ? <CaretUp weight="bold" size={20} /> : <CaretDown weight="bold" size={20} />}
        _hover={{ bg: "whiteAlpha.200" }}
        transition="all 0.2s ease"
      >
        {isExpanded ? "Ver Menos" : "Ver Mais"}
      </Button>
    </Flex>
  );

  // Renderização do componente
  return (
    <Box mt={12} {...containerProps}>
      <Flex justify="space-between" align="center" mb={6} {...headerProps}>
        <Heading color="white" size="lg" {...titleProps}>
          {title}
        </Heading>
        {link && (
          <Button
            as={RouterLink}
            to={link}
            variant="ghost"
            colorScheme="primary"
            size="sm"
            rightIcon={<CaretRight weight="bold" />}
            _hover={{ bg: "whiteAlpha.200" }}
            {...linkButtonProps}
          >
            {linkText}
          </Button>
        )}
      </Flex>

      {/* Renderizar os diferentes estados */}
      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : isEmpty ? (
        renderEmptyState()
      ) : (
        <>
          {renderContent(expandable && !isExpanded)}
          
          {/* Botão para expandir/contrair o conteúdo */}
          {expandable && renderExpandButton
            ? renderExpandButton(isExpanded, toggleExpand)
            : expandable && defaultExpandButton}
        </>
      )}
      
      {children}
    </Box>
  );
} 