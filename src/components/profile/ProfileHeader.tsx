import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Input,
  Flex,
  HStack,
  IconButton,
  useBreakpointValue,
  Tooltip,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../services/users";
import { FollowButton } from "../user/FollowButton";
import { ExtendedUser } from "../../types/auth";
import { UserAvatar } from "../common/UserAvatar";
import { Camera, PencilSimple } from "@phosphor-icons/react";

interface ProfileHeaderProps {
  isOwnProfile: boolean;
  profileUser: UserData | null;
  currentUser: ExtendedUser | null;
  userName: string;
  uploadingPhoto: boolean;
  uploadingCover: boolean;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  targetUserId: string;
  followersCount: number;
  followingCount: number;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
}

export function ProfileHeader({
  isOwnProfile,
  profileUser,
  currentUser,
  userName,
  handleCoverUpload,
  targetUserId,
  followersCount,
  followingCount,
  onShowFollowers,
  onShowFollowing,
}: ProfileHeaderProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  return (
    <Box
      position="relative"
      sx={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        paddingTop: "60px",
        marginTop: "-60px",
        position: "relative",
        zIndex: 1,
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <Box
        h={{ base: "200px", md: "300px" }}
        w="100%"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgImage={
            isOwnProfile
              ? currentUser?.coverURL || "url('/images/default-cover.jpg')"
              : profileUser?.coverURL || "url('/images/default-cover.jpg')"
          }
          bgSize="cover"
          bgPosition="center"
          transition="all 0.5s ease-in-out"
          transform="scale(1)"
          _hover={{ transform: "scale(1.05)" }}
          _after={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.3), rgba(23, 25, 35, 0.9) 60%, rgba(23, 25, 35, 1))",
          }}
        />

        <Input
          type="file"
          accept="image/*"
          display="none"
          ref={coverInputRef}
          onChange={handleCoverUpload}
        />
      </Box>

      <Container
        maxW="container.lg"
        position="relative"
        px={{ base: 4, md: 6 }}
      >
        <Flex
          direction="row"
          position="relative"
          mt={{ base: "-80px", md: "-100px" }}
          align="center"
          justify="space-between"
          mb={6}
        >
          <Flex
            direction="row"
            align="center"
            gap={{ base: 2, md: 4 }}
            flex="1"
            maxW={{ base: "72%", md: "80%" }}
          >
            <Box position="relative">
              <Box
                borderRadius="full"
                bg="gray.700"
                p="3px"
                boxShadow="0 4px 12px rgba(0,0,0,0.5)"
                display="inline-block"
              >
                <UserAvatar
                  size={useBreakpointValue({ base: "lg", md: "2xl" }) || "xl"}
                  photoURL={
                    isOwnProfile
                      ? currentUser?.photoURL
                      : profileUser?.photoURL
                  }
                  name={userName}
                  userId={isOwnProfile ? currentUser?.uid : profileUser?.id}
                />
              </Box>
            </Box>

            <VStack
              align="flex-start"
              spacing={1}
              maxW={{ base: "150px", md: "600px" }}
            >
              <Flex align="center">
                <Heading
                  size={{ base: "md", md: "xl" }}
                  color="white"
                  textShadow="0 2px 4px rgba(0,0,0,0.3)"
                  textAlign="left"
                  noOfLines={1}
                  mr={2}
                >
                  {userName}
                </Heading>
                {isOwnProfile ? (
                  <Tooltip label="Editar perfil" placement="top">
                    <IconButton
                      aria-label="Editar perfil"
                      icon={<PencilSimple weight="fill" />}
                      size="xs"
                      colorScheme="primary"
                      variant="ghost"
                      onClick={() => navigate("/settings/profile")}
                    />
                  </Tooltip>
                ) : (
                  <Box ml={1}>
                    <FollowButton userId={targetUserId} />
                  </Box>
                )}
              </Flex>
              <Text
                color="gray.300"
                fontSize={{ base: "xs", md: "md" }}
                textAlign="left"
                letterSpacing="0.5px"
                fontWeight="medium"
                noOfLines={1}
              >
                @{isOwnProfile ? currentUser?.username : profileUser?.username}
              </Text>
            </VStack>
          </Flex>

          <Flex direction="column" align="flex-end" minW={{ base: "80px", md: "auto" }}>
            <HStack spacing={{ base: 2, md: 4 }} align="center">
              <Flex 
                direction="column" 
                align="center" 
                cursor="pointer" 
                onClick={onShowFollowers}
                borderRadius="md"
                p={{ base: 1, md: 2 }}
                _hover={{ bg: "gray.700" }}
                transition="all 0.2s"
              >
                <Flex align="center" mb={1}>
                  <Text fontWeight="bold" color="white" fontSize={{ base: "sm", md: "md" }}>{followersCount}</Text>
                </Flex>
                <Text fontSize="xs" color="gray.300">Seguidores</Text>
              </Flex>

              <Box 
                h="20px" 
                w="1px" 
                bg="gray.600"
                alignSelf="center"
              />

              <Flex 
                direction="column" 
                align="center" 
                cursor="pointer" 
                onClick={onShowFollowing}
                borderRadius="md"
                p={{ base: 1, md: 2 }}
                _hover={{ bg: "gray.700" }}
                transition="all 0.2s"
              >
                <Flex align="center" mb={1}>
                  <Text fontWeight="bold" color="white" fontSize={{ base: "sm", md: "md" }}>{followingCount}</Text>
                </Flex>
                <Text fontSize="xs" color="gray.300">Seguindo</Text>
              </Flex>
            </HStack>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
} 