import { Button, useToast, type ButtonProps } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { followUser, isFollowing, unfollowUser } from "../../services/followers";
import { getGlobalLoginPopover } from "../layout/Navbar";
import { logError } from "../../utils/logger";

interface FollowButtonProps {
  userId: string;
  size?: ButtonProps["size"];
}

/** "Seguir" (primário) ou "Seguindo" (secundário, vira "Deixar de seguir" no hover). */
export function FollowButton({ userId, size = "sm" }: FollowButtonProps) {
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(!!currentUser);
  const [hovered, setHovered] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser || !userId) return;
    let cancelled = false;
    isFollowing(userId)
      .then((status) => !cancelled && setFollowing(status))
      .catch((error) => logError("checkFollowStatus", error))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentUser, userId]);

  if (!userId || currentUser?.uid === userId) return null;

  const handleClick = async () => {
    if (!currentUser) {
      getGlobalLoginPopover()?.();
      return;
    }
    setLoading(true);
    try {
      if (following) await unfollowUser(userId);
      else await followUser(userId);
      setFollowing(!following);
      for (const key of ["followers", "following"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Não foi possível atualizar",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={following ? "outline" : "solid"}
      minW="96px"
      isLoading={loading}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      color={following && hovered ? "danger" : undefined}
      borderColor={following && hovered ? "danger" : undefined}
      aria-pressed={following}
    >
      {following ? (hovered ? "Deixar de seguir" : "Seguindo") : "Seguir"}
    </Button>
  );
}
