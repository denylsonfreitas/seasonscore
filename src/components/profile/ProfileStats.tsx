import {
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Box,
} from "@chakra-ui/react";

interface ProfileStatsProps {
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
}

export function ProfileStats({
  reviewsCount,
  followersCount,
  followingCount,
  onShowFollowers,
  onShowFollowing,
}: ProfileStatsProps) {
  return (
    <HStack
      spacing={{ base: 4, md: 8 }}
      justify="center"
      bg="gray.800"
      p={{ base: 3, md: 4 }}
      borderRadius="lg"
      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
    >
      <Stat textAlign="center" flex="1">
        <StatLabel color="gray.400" fontSize={{ base: "xs", md: "sm" }}>
          Avaliações
        </StatLabel>
        <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
          {reviewsCount}
        </StatNumber>
      </Stat>
      <Stat
        cursor="pointer"
        onClick={onShowFollowers}
        _hover={{ color: "primary.300" }}
        textAlign="center"
        flex="1"
      >
        <StatLabel color="gray.400" fontSize={{ base: "xs", md: "sm" }}>
          Seguidores
        </StatLabel>
        <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
          {followersCount}
        </StatNumber>
      </Stat>
      <Stat
        cursor="pointer"
        onClick={onShowFollowing}
        _hover={{ color: "primary.300" }}
        textAlign="center"
        flex="1"
      >
        <StatLabel color="gray.400" fontSize={{ base: "xs", md: "sm" }}>
          Seguindo
        </StatLabel>
        <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
          {followingCount}
        </StatNumber>
      </Stat>
    </HStack>
  );
} 