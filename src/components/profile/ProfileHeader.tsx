import {
  Box,
  Container,
  Heading,
  VStack,
  Avatar,
  Text,
  Input,
  Flex,
  Button,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../services/users";
import { FollowButton } from "../user/FollowButton";
import { ExtendedUser } from "../../types/auth";

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
}

export function ProfileHeader({
  isOwnProfile,
  profileUser,
  currentUser,
  userName,
  handlePhotoUpload,
  handleCoverUpload,
  targetUserId,
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
        px={{ base: 4, md: 8 }}
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
            gap={4}
            flex="1"
            maxW={{ base: "75%", md: "80%" }}
          >
            <Box position="relative">
              <Box
                borderRadius="full"
                bg="gray.700"
                p="3px"
                boxShadow="0 4px 12px rgba(0,0,0,0.5)"
                display="inline-block"
              >
                <Avatar
                  size={{ base: "xl", md: "2xl" }}
                  src={
                    isOwnProfile
                      ? currentUser?.photoURL || undefined
                      : profileUser?.photoURL || undefined
                  }
                  name={userName}
                />
              </Box>
            </Box>

            <VStack
              align="flex-start"
              spacing={1}
              maxW={{ base: "160px", md: "600px" }}
            >
              <Heading
                size={{ base: "md", md: "xl" }}
                color="white"
                textShadow="0 2px 4px rgba(0,0,0,0.3)"
                textAlign="left"
                noOfLines={1}
              >
                {userName}
              </Heading>
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
              {(isOwnProfile ? currentUser?.description : profileUser?.description) && (
                <Text
                  color="gray.200"
                  maxW="600px"
                  textAlign="left"
                  fontSize={{ base: "xs", md: "md" }}
                  mt={1}
                  noOfLines={{ base: 1, md: 2 }}
                >
                  {isOwnProfile ? currentUser?.description : profileUser?.description}
                </Text>
              )}
            </VStack>
          </Flex>

          <Box>
            {!isOwnProfile && <FollowButton userId={targetUserId} />}
            {isOwnProfile && (
              <Button
                colorScheme="primary"
                onClick={() => navigate("/settings/profile")}
                size={{ base: "sm", md: "md" }}
              >
                Editar Perfil
              </Button>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
} 