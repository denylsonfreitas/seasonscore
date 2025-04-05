import { HStack, Icon, Text, Box } from "@chakra-ui/react";
import { Star } from "@phosphor-icons/react";
import { useState, useCallback, useMemo } from "react";

interface RatingStarsProps {
  rating: number;
  showNumber?: boolean;
  isEditable?: boolean;
  onChange?: (rating: number) => void;
  onRatingChange?: (rating: number) => void;
  size?: number;
}

export function RatingStars({
  rating,
  showNumber = true,
  isEditable = false,
  onChange,
  onRatingChange,
  size = 24,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleStarClick = useCallback((event: React.MouseEvent, index: number) => {
    if (!isEditable) return;

    const star = event.currentTarget as HTMLDivElement;
    const rect = star.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isHalfClick = x < rect.width / 2;

    const newRating = isHalfClick ? index + 0.5 : index + 1;
    if (onChange) onChange(newRating);
    if (onRatingChange) onRatingChange(newRating);
  }, [isEditable, onChange, onRatingChange]);

  const handleStarHover = useCallback((event: React.MouseEvent, index: number) => {
    if (!isEditable) return;

    const star = event.currentTarget as HTMLDivElement;
    const rect = star.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isHalfHover = x < rect.width / 2;
    
    const newHoverRating = isHalfHover ? index + 0.5 : index + 1;
    setHoverRating(newHoverRating);
  }, [isEditable]);

  const handleMouseLeave = useCallback(() => {
    setHoverRating(null);
  }, []);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const starsArray = useMemo(() => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      const isHalfStar = displayRating - index > 0 && displayRating - index < 1;
      const isFullStar = displayRating >= starValue;

      return (
        <Box
          key={index}
          position="relative"
          cursor={isEditable ? "pointer" : "default"}
          onClick={(e) => handleStarClick(e, index)}
          onMouseMove={(e) => handleStarHover(e, index)}
          width={`${size}px`}
          height={`${size}px`}
          transition="transform 0.1s ease-in-out"
          _hover={isEditable ? { transform: "scale(1.1)" } : {}}
        >
          <Icon
            as={Star}
            weight="regular"
            color="gray.400"
            fontSize={`${size}px`}
            position="absolute"
          />
          
          {isHalfStar && (
            <Icon
              as={Star}
              weight="fill"
              color="primary.500"
              position="absolute"
              style={{
                clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
              }}
              fontSize={`${size}px`}
            />
          )}
          
          {isFullStar && (
            <Icon
              as={Star}
              weight="fill"
              color="primary.500"
              position="absolute"
              fontSize={`${size}px`}
            />
          )}
        </Box>
      );
    });
  }, [displayRating, handleStarClick, handleStarHover, isEditable, size]);

  const ratingText = useMemo(() => {
    if (!showNumber) return null;
    return (
      <Text color="white" fontSize="sm" ml={2}>
        ({hoverRating !== null && isEditable ? hoverRating : rating}/5)
      </Text>
    );
  }, [showNumber, hoverRating, isEditable, rating]);

  return (
    <HStack spacing={1} onMouseLeave={handleMouseLeave}>
      {starsArray}
      {ratingText}
    </HStack>
  );
}
