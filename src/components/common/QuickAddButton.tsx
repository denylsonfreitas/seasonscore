import { Circle, useDisclosure } from "@chakra-ui/react";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
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

  const handleQuickAddSelect = (seriesId: number) => {
    setSelectedSeriesId(seriesId);
    onQuickAddClose();
    onReviewModalOpen();
  };

  const handleReviewModalBack = () => {
    onReviewModalClose();
    onQuickAddOpen();
  };

  return (
    <>
      <Circle 
        size={size} 
        bg="teal.500" 
        color="white" 
        cursor="pointer"
        _hover={{ bg: "teal.600" }}
        onClick={onQuickAddOpen}
      >
        <Plus size={parseInt(size) * 0.625} weight="bold" />
      </Circle>

      {/* Modal de Busca para Avaliação Rápida */}
      <SearchModal 
        isOpen={isQuickAddOpen} 
        onClose={onQuickAddClose} 
        onSelect={handleQuickAddSelect}
        title="Avaliar Série"
        subtitle="Busque uma série para avaliar rapidamente"
      />

      {/* Modal de Avaliação */}
      {selectedSeriesId && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={onReviewModalClose}
          seriesId={selectedSeriesId}
          onBack={handleReviewModalBack}
        />
      )}
    </>
  );
} 