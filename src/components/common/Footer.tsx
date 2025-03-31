import { Box, Container, Text, HStack, Link, Icon, VStack, Button } from "@chakra-ui/react";
import { GithubLogo, LinkedinLogo } from "@phosphor-icons/react";

export function Footer() {
  return (
    <Box bg="gray.900" py={6} color="white" mt="auto">
      <Container maxW="container.lg">
        <VStack spacing={4}>
          <HStack spacing={6} justify="center">
            <Link
              href="https://github.com/denylsonfreitas"
              target="_blank"
              rel="noopener noreferrer"
              color="gray.400"
              _hover={{ color: "white" }}
            >
              <HStack spacing={2}>
                <Icon as={GithubLogo} weight="fill" boxSize={5} />
                <Text>GitHub</Text>
              </HStack>
            </Link>
            <Link
              href="https://linkedin.com/in/denylsonfreitas"
              target="_blank"
              rel="noopener noreferrer"
              color="gray.400"
              _hover={{ color: "white" }}
            >
              <HStack spacing={2}>
                <Icon as={LinkedinLogo} weight="fill" boxSize={5} />
                <Text>LinkedIn</Text>
              </HStack>
            </Link>
          </HStack>
          {/*© {new Date().getFullYear()}*/}
          <Text color="gray.500" fontSize="sm">
            SeasonScore é um projeto independente e esta limitado a erros, feedbacks e melhorias são sempre bem-vindos.
          </Text>
          <Button onClick={() => {
            window.open("https://github.com/denylsonfreitas/seasonscore/issues", "_blank");
          }}>
            Reportar um erro
          </Button>
          <Text color="gray.600" fontSize="xs">
            Dados fornecidos por TMDb
          </Text>
        </VStack>
      </Container>
    </Box>
  );
} 