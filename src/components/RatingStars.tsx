import { HStack, Icon, Text } from "@chakra-ui/react";
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
  const handleClick = (index: number) => {
    if (isEditable) {
      const newRating = index + 1;
      if (onChange) onChange(newRating);
      if (onRatingChange) onRatingChange(newRating);
    }
  };

  return (
    <HStack spacing={1}>
      {[...Array(5)].map((_, index) => (
        <Icon
          key={index}
          as={Star}
          weight={index < rating ? "fill" : "regular"}
          color={index < rating ? "yellow.400" : "gray.400"}
          cursor={isEditable ? "pointer" : "default"}
          onClick={() => handleClick(index)}
          fontSize={`${size}px`}
        />
      ))}
      {showNumber && (
        <Text color="white" fontSize="sm" ml={2}>
          ({rating}/5)
        </Text>
      )}
    </HStack>
  );
}
