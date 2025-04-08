import React from 'react';
import { Box, Skeleton, Center, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
}

const MotionBox = motion(Box);

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  showSkeleton = false,
  skeletonCount = 3
}) => {
  return (
    <Center minH="75vh" p={4}>
      <VStack spacing={4}>
        <MotionBox
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Box
            w="50px"
            h="50px"
            borderRadius="full"
            bgGradient="linear(to-r, primary.500, secondary.500)"
            opacity={0.8}
          />
        </MotionBox>

        <Text color="gray.500" fontSize="lg">
          {message}
        </Text>

        {showSkeleton && (
          <VStack spacing={4} w="100%" maxW="400px">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <Skeleton
                key={index}
                height="60px"
                width="100%"
                borderRadius="md"
                startColor="gray.100"
                endColor="gray.300"
              />
            ))}
          </VStack>
        )}
      </VStack>
    </Center>
  );
}; 