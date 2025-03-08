import { Box, Container, Text, HStack, Link, Icon, VStack } from "@chakra-ui/react";
import { GithubLogo, LinkedinLogo } from "@phosphor-icons/react";

export function Footer() {
  return (
    <Box bg="gray.800" py={8} mt="auto">
      <Container maxW="1200px">
        <VStack spacing={4}>
          <HStack spacing={6} justify="center">
            <Link
              href="https://github.com/seu-usuario"
              isExternal
              color="gray.400"
              _hover={{ color: "white" }}
            >
              <HStack spacing={2}>
                <Icon as={GithubLogo} weight="fill" boxSize={5} />
                <Text>GitHub</Text>
              </HStack>
            </Link>
            <Link
              href="https://linkedin.com/in/seu-usuario"
              isExternal
              color="gray.400"
              _hover={{ color: "white" }}
            >
              <HStack spacing={2}>
                <Icon as={LinkedinLogo} weight="fill" boxSize={5} />
                <Text>LinkedIn</Text>
              </HStack>
            </Link>
          </HStack>
          <Text color="gray.500" fontSize="sm">
            © {new Date().getFullYear()} SeasonScore. Todos os direitos reservados.
          </Text>
          <Text color="gray.600" fontSize="xs">
            Dados fornecidos por TMDb
          </Text>
        </VStack>
      </Container>
    </Box>
  );
} 