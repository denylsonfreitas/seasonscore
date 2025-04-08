import { useDisclosure, Button, useBreakpointValue, IconButton } from "@chakra-ui/react";
import { Plus } from "@phosphor-icons/react";
import { useState, useCallback, useMemo } from "react";
import { SearchModal } from "../layout/SearchModal";
import { ReviewModal } from "../reviews/ReviewModal";

interface QuickAddButtonProps {
  size?: string;
}

export function QuickAddButton({ size = "32px" }: QuickAddButtonProps) {
  const { 
    isOpen: isQuickAddOpen, 
    onOpen: onQuickAddOpen, 
    onClose: onQuickAddClose 
  } = useDisclosure();
  
  const { 
    isOpen: isReviewModalOpen, 
    onOpen: onReviewModalOpen, 
    onClose: onReviewModalClose 
  } = useDisclosure();
  
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  
  const showButtonText = useBreakpointValue({ base: false, sm: true });

  const handleQuickAddSelect = useCallback((seriesId: number) => {
    setSelectedSeriesId(seriesId);
    onQuickAddClose();
    onReviewModalOpen();
  }, [onQuickAddClose, onReviewModalOpen]);

  const handleReviewModalBack = useCallback(() => {
    onReviewModalClose();
    onQuickAddOpen();
  }, [onReviewModalClose, onQuickAddOpen]);

  const addButton = useMemo(() => {
    if (showButtonText) {
      return (
        <Button
          colorScheme="primary"
          variant="solid"
          borderRadius="full"
          height={size}
          px="16px"
          onClick={onQuickAddOpen}
          leftIcon={<Plus weight="bold" />}
          fontWeight="500"
          fontSize="14px"
        >
          Avaliar
        </Button>
      );
    } else {
      return (
        <IconButton
          aria-label="Avaliar série"
          icon={<Plus weight="bold" />}
          colorScheme="primary"
          borderRadius="full"
          height={size}
          width={size}
          minW={size}
          onClick={onQuickAddOpen}
        />
      );
    }
  }, [showButtonText, size, onQuickAddOpen]);

  const modals = useMemo(() => (
    <>
      <SearchModal 
        isOpen={isQuickAddOpen} 
        onClose={onQuickAddClose} 
        onSelect={handleQuickAddSelect}
        title="Avaliar Série"
        subtitle="Busque uma série para avaliar rapidamente"
      />

      {selectedSeriesId && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={onReviewModalClose}
          seriesId={selectedSeriesId}
          onBack={handleReviewModalBack}
        />
      )}
    </>
  ), [
    isQuickAddOpen, 
    onQuickAddClose, 
    handleQuickAddSelect, 
    selectedSeriesId, 
    isReviewModalOpen, 
    onReviewModalClose, 
    handleReviewModalBack
  ]);

  return (
    <>
      {addButton}
      {modals}
    </>
  );
} 