import { Box, IconButton } from "@chakra-ui/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Children, ReactNode, useCallback, useEffect, useRef, useState } from "react";

type ResponsiveCount = { base: number; sm?: number; md?: number; lg?: number };

export const carouselPresets = {
  // frações no celular deixam o próximo item aparecendo, indicando que dá para arrastar
  series: { base: 2.3, sm: 3.3, md: 4, lg: 6 },
  lists: { base: 1.1, md: 2, lg: 3 },
  cast: { base: 2.3, sm: 3.3, md: 4, lg: 5 },
} satisfies Record<string, ResponsiveCount>;

export type CarouselPreset = keyof typeof carouselPresets;

interface CarouselProps {
  children: ReactNode;
  /** Quantidade de itens visíveis por breakpoint. */
  preset?: CarouselPreset;
  /** Espaço entre os itens (unidades do tema do Chakra). */
  gap?: number;
  /** Rótulo acessível para a região do carrossel. */
  label?: string;
}

const GAP_UNIT_PX = 4;

function itemWidth(count: number, gapPx: number) {
  return `calc((100% - ${(count - 1) * gapPx}px) / ${count})`;
}

/**
 * Carrossel horizontal leve baseado em CSS scroll-snap.
 * Funciona com toque/trackpad e exibe setas de navegação no desktop.
 */
export function Carousel({ children, preset = "series", gap = 2, label }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const counts = carouselPresets[preset] as ResponsiveCount;
  const gapPx = gap * GAP_UNIT_PX;
  const flexBasis = Object.fromEntries(
    Object.entries(counts).map(([bp, count]) => [bp, itemWidth(count as number, gapPx)])
  );

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, children]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrowStyles = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    size: "sm",
    bg: "ink.900",
    border: "1px solid",
    borderColor: "ink.700",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    color: "ink.100",
    _hover: { bg: "ink.800", color: "ink.50" },
    display: { base: "none", md: "inline-flex" },
  };

  return (
    <Box position="relative" role="region" aria-roledescription="carrossel" aria-label={label}>
      {canPrev && (
        <IconButton
          aria-label="Anterior"
          icon={<CaretLeft size={16} />}
          left="-12px"
          onClick={() => scrollByPage(-1)}
          {...arrowStyles}
        />
      )}
      <Box
        ref={trackRef}
        display="flex"
        gap={`${gapPx}px`}
        overflowX="auto"
        py={2}
        scrollSnapType="x mandatory"
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {Children.map(children, (child) =>
          child == null ? null : (
            <Box flex="0 0 auto" width={flexBasis} scrollSnapAlign="start" minW={0}>
              {child}
            </Box>
          )
        )}
      </Box>
      {canNext && (
        <IconButton
          aria-label="Próximo"
          icon={<CaretRight size={16} />}
          right="-12px"
          onClick={() => scrollByPage(1)}
          {...arrowStyles}
        />
      )}
    </Box>
  );
}
