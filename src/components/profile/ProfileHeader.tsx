import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { PencilSimple } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import type { UserData } from "../../services/users";
import type { ExtendedUser } from "../../types/auth";
import { FollowButton } from "../user/FollowButton";
import { UserAvatar } from "../common/UserAvatar";
import { NAV_HEIGHT } from "../layout/Navbar";

interface ProfileHeaderProps {
  isOwnProfile: boolean;
  profileUser: UserData | null;
  currentUser: ExtendedUser | null;
  userName: string;
  targetUserId: string;
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
}

function Stat({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) {
  return (
    <Box
      as={onClick ? "button" : "div"}
      onClick={onClick}
      textAlign="left"
      color="ink.300"
      _hover={onClick ? { color: "ink.50" } : undefined}
      transition="color 120ms ease"
    >
      <Text as="span" fontFamily="mono" fontWeight={600} color="ink.50" mr={1.5}>
        {value}
      </Text>
      <Text as="span" fontSize="sm">
        {label}
      </Text>
    </Box>
  );
}

/** Topo do perfil: capa, avatar, nome, bio, série favorita e números. */
export function ProfileHeader({
  isOwnProfile,
  profileUser,
  currentUser,
  userName,
  targetUserId,
  reviewsCount,
  followersCount,
  followingCount,
  onShowFollowers,
  onShowFollowing,
}: ProfileHeaderProps) {
  const source = isOwnProfile ? currentUser : profileUser;
  const cover = isOwnProfile ? currentUser?.coverURL : profileUser?.coverURL;
  const photo = isOwnProfile ? currentUser?.photoURL : profileUser?.photoURL;
  const username = isOwnProfile ? currentUser?.username : profileUser?.username;
  const favorite = source?.favoriteSeries ?? null;
  const bio = source?.description;
  const avatarSize = useBreakpointValue({ base: "xl", md: "2xl" }) as "xl" | "2xl" | undefined;

  return (
    <Box as="header" position="relative" mt={`-${NAV_HEIGHT}`}>
      <Box
        h={{ base: "180px", md: "260px" }}
        position="relative"
        overflow="hidden"
        bg="ink.900"
        aria-hidden="true"
      >
        {cover ? (
          <Box
            position="absolute"
            inset={0}
            bgImage={`url("${cover}")`}
            bgSize="cover"
            bgPosition="center"
          />
        ) : favorite?.backdrop_path ? (
          <Box
            position="absolute"
            inset={0}
            bgImage={`url(https://image.tmdb.org/t/p/w1280${favorite.backdrop_path})`}
            bgSize="cover"
            bgPosition="center 25%"
            opacity={0.6}
          />
        ) : null}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(to top, #0F0F0E 0%, rgba(15,15,14,0.55) 55%, rgba(15,15,14,0.35) 100%)"
        />
      </Box>

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6, lg: 8 }} position="relative">
        <Flex
          mt={{ base: "-48px", md: "-72px" }}
          gap={{ base: 4, md: 8 }}
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "flex-end" }}
          justify="space-between"
        >
          <Flex gap={{ base: 4, md: 6 }} align="flex-end" minW={0}>
            <Box borderRadius="full" p="3px" bg="ink.950" flexShrink={0}>
              <UserAvatar
                size={avatarSize ?? "xl"}
                photoURL={photo}
                name={userName}
                userId={targetUserId}
              />
            </Box>
            <Box minW={0} pb={{ base: 1, md: 3 }}>
              <Heading as="h1" size="h1" noOfLines={1}>
                {userName}
              </Heading>
              {username && (
                <Text mt={1} fontFamily="mono" fontSize="sm" color="ink.400">
                  @{username}
                </Text>
              )}
            </Box>
          </Flex>

          <Box pb={{ md: 3 }}>
            {isOwnProfile ? (
              <Button
                as={RouterLink}
                to="/settings/profile"
                variant="outline"
                size="sm"
                leftIcon={<PencilSimple size={14} />}
              >
                Editar perfil
              </Button>
            ) : (
              <FollowButton userId={targetUserId} />
            )}
          </Box>
        </Flex>

        <Flex
          mt={5}
          gap={{ base: 5, md: 10 }}
          direction={{ base: "column", md: "row" }}
          justify="space-between"
        >
          <Box maxW="640px">
            {bio && (
              <Text color="ink.200" whiteSpace="pre-wrap">
                {bio}
              </Text>
            )}
            <HStack spacing={5} mt={bio ? 4 : 0} wrap="wrap">
              <Stat
                value={reviewsCount}
                label={reviewsCount === 1 ? "temporada avaliada" : "temporadas avaliadas"}
              />
              <Stat value={followersCount} label="seguidores" onClick={onShowFollowers} />
              <Stat value={followingCount} label="seguindo" onClick={onShowFollowing} />
            </HStack>
          </Box>

          {favorite && (
            <Link
              as={RouterLink}
              to={`/series/${favorite.id}`}
              display="flex"
              gap={3}
              alignItems="center"
              p={2.5}
              pr={4}
              border="1px solid"
              borderColor="ink.800"
              borderRadius="md"
              alignSelf="flex-start"
              flexShrink={0}
              _hover={{ borderColor: "ink.600", textDecoration: "none" }}
            >
              {favorite.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${favorite.poster_path}`}
                  alt=""
                  w="36px"
                  borderRadius="sm"
                />
              )}
              <Box>
                <Text textStyle="label" color="ink.400">
                  Série favorita
                </Text>
                <Text fontSize="sm" fontWeight={600} color="ink.100" noOfLines={1}>
                  {favorite.name}
                </Text>
              </Box>
            </Link>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
