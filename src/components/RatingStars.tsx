import { HStack, Icon, Text, Box } from "@chakra-ui/react";
import { Star } from "@phosphor-icons/react";

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

  return (
    <HStack spacing={1}>
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const isHalfStar = rating - index > 0 && rating - index < 1;
        const isFullStar = rating >= starValue;

        return (
          <Box
            key={index}
            position="relative"
            cursor={isEditable ? "pointer" : "default"}
            onClick={(e) => handleStarClick(e, index)}
            width={`${size}px`}
            height={`${size}px`}
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
                color="yellow.400"
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
                color="yellow.400"
                position="absolute"
                fontSize={`${size}px`}
              />
            )}

            {/* Áreas clicáveis invisíveis */}
            {isEditable && (
              <>
                <Box
                  position="absolute"
                  left="0"
                  width="50%"
                  height="100%"
                  zIndex={2}
                  title="Meia estrela"
                />
                <Box
                  position="absolute"
                  left="50%"
                  width="50%"
                  height="100%"
                  zIndex={2}
                  title="Estrela cheia"
                />
              </>
            )}
          </Box>
        );
      })}
      {showNumber && (
        <Text color="white" fontSize="sm" ml={2}>
          ({rating}/5)
        </Text>
      )}
    </HStack>
  );
}
