import { Box, Flex, Skeleton } from "@chakra-ui/react";

export function ListCarouselSkeleton() {
  return (
    <Flex gap={4} overflow="hidden">
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          flex={{ base: "0 0 100%", md: "0 0 calc(50% - 8px)", lg: "0 0 calc(33.33% - 11px)" }}
        >
          <Skeleton h="280px" borderRadius="md" startColor="ink.900" endColor="ink.850" />
        </Box>
      ))}
    </Flex>
  );
}
