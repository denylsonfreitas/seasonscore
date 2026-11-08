import { House, Warning } from "@phosphor-icons/react";
import React from "react";
import { Box, Button, Heading, Text, VStack, Flex, Icon } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <Flex minHeight="75vh" direction="column" align="center" justify="center" px={4} py={10}>
      <VStack spacing={8} textAlign="center" maxW="600px">
        <Icon as={Warning} weight="fill" w={20} h={20} color="primary.500" />

        <Heading as="h1" size="2xl" color="primary.500">
          404
        </Heading>

        <VStack spacing={4}>
          <Heading as="h2" size="xl">
            Página não encontrada
          </Heading>

          <Text fontSize="lg" color="gray.300">
            Oops! A página que você está procurando parece não existir ou foi movida para outro
            lugar.
          </Text>

          <Text color="gray.400">
            Talvez a URL esteja incorreta ou a página tenha sido removida.
          </Text>
        </VStack>

        <Box pt={6}>
          <Button
            as={Link}
            to="/"
            size="lg"
            colorScheme="primary"
            leftIcon={<House weight="fill" />}
          >
            Voltar para a página inicial
          </Button>
        </Box>
      </VStack>
    </Flex>
  );
}
