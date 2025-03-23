import { HStack, Icon, Text, Box } from "@chakra-ui/react";
import { Star } from "@phosphor-icons/react";
import { useState } from "react";

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

  const handleStarClick = (event: React.MouseEvent, index: number) => {
    if (!isEditable) return;

    const star = event.currentTarget as HTMLDivElement;
    const rect = star.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isHalfClick = x < rect.width / 2;

    const newRating = isHalfClick ? index + 0.5 : index + 1;
    if (onChange) onChange(newRating);
    if (onRatingChange) onRatingChange(newRating);
  };

  const handleStarHover = (event: React.MouseEvent, index: number) => {
    if (!isEditable) return;

    const star = event.currentTarget as HTMLDivElement;
    const rect = star.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isHalfHover = x < rect.width / 2;
    
    const newHoverRating = isHalfHover ? index + 0.5 : index + 1;
    setHoverRating(newHoverRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <HStack spacing={1} onMouseLeave={handleMouseLeave}>
      {[...Array(5)].map((_, index) => {
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
            {/* Estrela base (vazia) */}
            <Icon
              as={Star}
              weight="regular"
              color="gray.400"
              fontSize={`${size}px`}
              position="absolute"
            />
            
            {/* Meia estrela */}
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
            
            {/* Estrela cheia */}
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
      })}
      {showNumber && (
        <Text color="white" fontSize="sm" ml={2}>
          ({hoverRating !== null && isEditable ? hoverRating : rating}/5)
        </Text>
      )}
    </HStack>
  );
}
