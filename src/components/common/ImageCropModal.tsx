import {
  Box,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowCounterClockwise,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { CROP_PRESETS, cropImage, type CropKind } from "../../utils/cropImage";

interface ImageCropModalProps {
  isOpen: boolean;
  /** URL local (object URL) da imagem escolhida. */
  imageSrc: string | null;
  kind: CropKind;
  onCancel: () => void;
  /** Recebe a imagem já recortada e redimensionada. */
  onConfirm: (file: File) => Promise<void> | void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/** Ajuste de enquadramento antes de enviar foto de perfil ou capa. */
export function ImageCropModal({
  isOpen,
  imageSrc,
  kind,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preset = CROP_PRESETS[kind];
  const isAvatar = kind === "avatar";

  // Recomeça o enquadramento a cada nova imagem
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setError(null);
  }, [imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const handleConfirm = async () => {
    if (!imageSrc || !area) return;
    setIsSaving(true);
    setError(null);
    try {
      const file = await cropImage(imageSrc, area, kind);
      await onConfirm(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar a imagem");
    } finally {
      setIsSaving(false);
    }
  };

  const nudgeZoom = (delta: number) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 10) / 10)));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onCancel}
      size={isAvatar ? "md" : "2xl"}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isAvatar ? "Ajustar foto de perfil" : "Ajustar capa"}</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <Box
            position="relative"
            h={isAvatar ? { base: "300px", md: "340px" } : { base: "220px", md: "320px" }}
            bg="ink.950"
            borderRadius="md"
            overflow="hidden"
          >
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                aspect={preset.aspect}
                cropShape={isAvatar ? "round" : "rect"}
                showGrid={!isAvatar}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  cropAreaStyle: {
                    border: "2px solid rgba(247,246,242,0.9)",
                    color: "rgba(15,15,14,0.72)",
                  },
                }}
              />
            )}
          </Box>

          <HStack mt={4} spacing={3}>
            <IconButton
              aria-label="Diminuir zoom"
              icon={<MagnifyingGlassMinus size={18} />}
              size="sm"
              variant="ghost"
              onClick={() => nudgeZoom(-0.2)}
              isDisabled={zoom <= MIN_ZOOM}
            />
            <Slider
              aria-label="Zoom"
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              onChange={setZoom}
              focusThumbOnChange={false}
            >
              <SliderTrack bg="ink.800">
                <SliderFilledTrack bg="signal.400" />
              </SliderTrack>
              <SliderThumb boxSize={4} bg="ink.50" />
            </Slider>
            <IconButton
              aria-label="Aumentar zoom"
              icon={<MagnifyingGlassPlus size={18} />}
              size="sm"
              variant="ghost"
              onClick={() => nudgeZoom(0.2)}
              isDisabled={zoom >= MAX_ZOOM}
            />
            <IconButton
              aria-label="Recomeçar enquadramento"
              title="Recomeçar"
              icon={<ArrowCounterClockwise size={18} />}
              size="sm"
              variant="ghost"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
            />
          </HStack>

          <Text mt={2} fontSize="xs" color="ink.400">
            Arraste a imagem para posicionar. Use o controle, a roda do mouse ou o gesto de pinça
            para o zoom.
            {!isAvatar &&
              " A capa aparece mais estreita no celular, então mantenha o principal no centro."}
          </Text>
          {error && (
            <Text mt={2} fontSize="sm" color="danger">
              {error}
            </Text>
          )}
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onCancel} isDisabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={isSaving}
            loadingText="Enviando"
            isDisabled={!area}
          >
            Aplicar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
