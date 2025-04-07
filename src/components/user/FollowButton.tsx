import { Button, useToast, Box, Icon, Tooltip } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { followUser, unfollowUser, isFollowing } from "../../services/followers";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserMinus, SignIn } from "@phosphor-icons/react";

interface FollowButtonProps {
  userId: string;
}

export function FollowButton({ userId }: FollowButtonProps) {
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (currentUser) {
        try {
          const status = await isFollowing(userId);
          setFollowing(status);
        } catch (error) {
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [currentUser, userId]);

  const handleFollow = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      if (following) {
        await unfollowUser(userId);
        setFollowing(false);
        toast({
          title: "Sucesso",
          description: "Você deixou de seguir este usuário",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await followUser(userId);
        setFollowing(true);
        toast({
          title: "Sucesso",
          description: "Você começou a seguir este usuário",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      // Invalidar queries relacionadas a seguidores
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status de seguidor",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.uid === userId) return null;

  if (!currentUser) {
    return (
      <Tooltip label="Entrar para seguir" placement="top" hasArrow>
        <Button
          colorScheme="primary"
          variant="solid"
          onClick={() => navigate("/login")}
          size="sm"
          p={0}
          minW="30px"
          h="30px"
          borderRadius="full"
        >
          <Icon as={SignIn} weight="bold" />
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={following ? "Deixar de seguir" : "Seguir"} placement="top" hasArrow>
      <Button
        color={following ? "gray.100" : "gray.100"}
        bg={following ? "followbutton.unfollow" : "followbutton.follow"}
        variant={following ? "solid" : "solid"}
        _hover={{
          bg: following ? "gray.100" : "gray.100",
          color: following ? "followbutton.unfollow" : "followbutton.follow",
        }}
        onClick={handleFollow}
        isLoading={loading}
        size="sm"
        p={0}
        minW="30px"
        h="30px"
        borderRadius="full"
      >
        <Icon as={following ? UserMinus : UserPlus} weight="bold" />
      </Button>
    </Tooltip>
  );
} 