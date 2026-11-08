import { Box, Flex, Heading, Link, Skeleton, Text, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { ArrowRight, Tray } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { EmptyState } from "./EmptyState";

export interface SectionBaseProps {
  title: string;
  /** Rótulo curto acima do título, em caixa alta mono ("EM ALTA"). */
  eyebrow?: string;
  link?: string;
  linkText?: string;
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  loadingElement?: ReactNode;
  errorElement?: ReactNode;
  emptyElement?: ReactNode;
  expandable?: boolean;
  containerProps?: BoxProps;
  renderContent: (limitItems: boolean) => ReactNode;
  children?: ReactNode;
}

function DefaultLoading() {
  return (
    <Flex gap={3} overflow="hidden">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton
          key={i}
          flex="0 0 auto"
          w={{ base: "45%", sm: "30%", md: "22%", lg: "15.5%" }}
          aspectRatio={2 / 3}
          borderRadius="md"
          startColor="ink.850"
          endColor="ink.800"
        />
      ))}
    </Flex>
  );
}

/** Seção da página: rótulo, título h2, link "Ver tudo" e os estados de carregamento. */
export function SectionBase({
  title,
  eyebrow,
  link,
  linkText = "Ver tudo",
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = "Nada por aqui ainda.",
  emptyDescription,
  loadingElement,
  errorElement,
  emptyElement,
  expandable = false,
  containerProps,
  renderContent,
  children,
}: SectionBaseProps) {
  let body: ReactNode;
  if (isLoading) body = loadingElement ?? <DefaultLoading />;
  else if (error)
    body = errorElement ?? (
      <Text color="ink.300" fontSize="sm">
        Não foi possível carregar esta seção. Tente recarregar a página.
      </Text>
    );
  else if (isEmpty)
    body = emptyElement ?? (
      <EmptyState icon={Tray} title={emptyMessage} description={emptyDescription} />
    );
  else body = renderContent(expandable);

  return (
    <Box as="section" py={{ base: 6, md: 8 }} {...containerProps}>
      <Flex justify="space-between" align="flex-end" gap={4} mb={{ base: 4, md: 5 }}>
        <Box>
          {eyebrow && (
            <Text textStyle="label" color="ink.400" mb={1.5}>
              {eyebrow}
            </Text>
          )}
          <Heading as="h2" size="h2">
            {title}
          </Heading>
        </Box>
        {link && (
          <Link
            as={RouterLink}
            to={link}
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            flexShrink={0}
            fontSize="sm"
            fontWeight={500}
            color="ink.300"
            _hover={{ color: "ink.50", textDecoration: "none" }}
          >
            {linkText}
            <ArrowRight size={14} />
          </Link>
        )}
      </Flex>

      {body}
      {children}
    </Box>
  );
}
