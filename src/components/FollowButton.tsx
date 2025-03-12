import { Button, useToast } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { followUser, unfollowUser, isFollowing } from "../services/followers";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

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
          console.error("Erro ao verificar status de seguidor:", error);
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
      <Button
        colorScheme="teal"
        variant="solid"
        onClick={() => navigate("/login")}
        size="sm"
      >
        Entrar para Seguir
      </Button>
    );
  }

  return (
    <Button
      colorScheme={following ? "red" : "teal"}
      variant={following ? "outline" : "solid"}
      onClick={handleFollow}
      isLoading={loading}
      size="sm"
    >
      {following ? "Deixar de Seguir" : "Seguir"}
    </Button>
  );
} 