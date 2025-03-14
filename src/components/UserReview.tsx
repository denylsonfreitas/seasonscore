import {
  Box,
  Text,
  HStack,
  Avatar,
  VStack,
  Button,
  Collapse,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { RatingStars } from "./RatingStars";
import { useState, useEffect } from "react";
import { Comment } from "../types/review";
import { ReviewComment } from "./ReviewComment";
import { AddComment } from "./AddComment";
import { ChatCircle, ThumbsUp, ThumbsDown, CaretDown, CaretUp } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import { toggleReaction } from "../services/reviews";
import { ReactNode } from "react";
import { getUserData } from "../services/users";
import { UserName } from "./UserName";

interface UserReviewProps {
  reviewId: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  seasonNumber: number;
  comments: Comment[];
  reactions?: {
    likes: string[];
    dislikes: string[];
  };
  createdAt: Date | { seconds: number };
  onReviewUpdated?: () => void;
  children?: ReactNode;
}

export function UserReview({
  reviewId,
  userId,
  userEmail,
  rating,
  comment,
  seasonNumber,
  comments = [],
  reactions = { likes: [], dislikes: [] },
  createdAt,
  onReviewUpdated,
  children,
}: UserReviewProps) {
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<{ photoURL?: string | null } | null>(null);

  const COMMENTS_PER_PAGE = 3;
  const hasMoreComments = comments.length > COMMENTS_PER_PAGE;
  const visibleComments = showAllComments ? comments : comments.slice(0, COMMENTS_PER_PAGE);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData(userId);
        setUserData(data);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  const userLiked = currentUser && reactions.likes.includes(currentUser.uid);
  const userDisliked = currentUser && reactions.dislikes.includes(currentUser.uid);

  const handleReaction = async (type: "likes" | "dislikes") => {
    if (!currentUser) return;
    try {
      await toggleReaction(reviewId, seasonNumber, type);
      onReviewUpdated?.();
    } catch (error) {
      console.error("Erro ao reagir à avaliação:", error);
    }
  };

  return (
    <Box bg="gray.800"  borderRadius="lg">
      <VStack align="stretch" spacing={4}>
        {/* Cabeçalho com informações do usuário */}
        <HStack spacing={4} justify="space-between">
          <HStack spacing={4}>
            <Avatar 
              size="sm" 
              name={userEmail} 
              src={userData?.photoURL || undefined}
            />
            <VStack align="start" spacing={0}>
              <UserName userId={userId} />
              <HStack spacing={2}>
                <RatingStars rating={rating} size={16} />
                <Text color="gray.400" fontSize="sm">
                  {new Date(
                    createdAt instanceof Date ? createdAt : createdAt.seconds * 1000
                  ).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          {children}
        </HStack>

        {/* Comentário da avaliação */}
        {comment && (
          <Text color="gray.300">
            {comment}
          </Text>
        )}

        {/* Reações e botão de comentários */}
        <HStack spacing={4} pt={2}>
          <HStack>
            <IconButton
              aria-label="Like"
              icon={<ThumbsUp weight={userLiked ? "fill" : "regular"} />}
              size="sm"
              variant="ghost"
              color={userLiked ? "teal.400" : "gray.400"}
              onClick={() => handleReaction("likes")}
            />
            <Text color="gray.400" fontSize="sm">
              {reactions.likes.length}
            </Text>
          </HStack>

          <HStack>
            <IconButton
              aria-label="Dislike"
              icon={<ThumbsDown weight={userDisliked ? "fill" : "regular"} />}
              size="sm"
              variant="ghost"
              color={userDisliked ? "red.400" : "gray.400"}
              onClick={() => handleReaction("dislikes")}
            />
            <Text color="gray.400" fontSize="sm">
              {reactions.dislikes.length}
            </Text>
          </HStack>

          <Button
            leftIcon={<ChatCircle size={20} />}
            size="sm"
            variant="ghost"
            color="gray.400"
            onClick={() => setShowComments(!showComments)}
          >
            {comments.length} comentários
          </Button>
        </HStack>

        {/* Seção de comentários */}
        <Collapse in={showComments}>
          <VStack spacing={4} pt={2} width="100%">
            <Divider borderColor="gray.700" />
            
            {/* Caixa de comentário */}
            <AddComment
              reviewId={reviewId}
              seasonNumber={seasonNumber}
              onCommentAdded={onReviewUpdated}
            />

            {/* Lista de comentários */}
            {visibleComments.map((comment) => (
              <ReviewComment
                key={comment.id}
                reviewId={reviewId}
                seasonNumber={seasonNumber}
                comment={comment}
                onCommentDeleted={onReviewUpdated}
              />
            ))}

            {/* Botão Ver Mais */}
            {hasMoreComments && (
              <Button
                variant="ghost"
                color="teal.400"
                size="sm"
                width="100%"
                onClick={() => setShowAllComments(!showAllComments)}
                rightIcon={showAllComments ? <CaretUp /> : <CaretDown />}
              >
                {showAllComments 
                  ? "Ver menos" 
                  : `Ver mais ${comments.length - COMMENTS_PER_PAGE} comentários`}
              </Button>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
} 