import { useDisclosure, Button, useBreakpointValue, IconButton } from "@chakra-ui/react";
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
  
  // Determine se deve mostrar o texto do botão com base no tamanho da tela
  const showButtonText = useBreakpointValue({ base: false, sm: true });

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
      {showButtonText ? (
        <Button
          bg="primary.500"
          color="white"
          borderRadius="full"
          height={size}
          px="16px"
          _hover={{ bg: "primary.600" }}
          onClick={onQuickAddOpen}
          leftIcon={<Plus weight="bold" />}
          fontWeight="500"
          fontSize="14px"
        >
          Avaliar
        </Button>
      ) : (
        <IconButton
          aria-label="Avaliar série"
          icon={<Plus weight="bold" />}
          bg="primary.500"
          color="white"
          borderRadius="full"
          height={size}
          width={size}
          minW={size}
          _hover={{ bg: "primary.600" }}
          onClick={onQuickAddOpen}
        />
      )}

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