import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Box,
  useMediaQuery,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import { SeasonsTabs } from "./SeasonsTabs";
import { SeriesDetailsTab } from "./tabs/SeriesDetailsTab";
import { SeriesWatchProvidersTab } from "./tabs/SeriesWatchProvidersTab";
import { SeriesCastTab } from "./tabs/SeriesCastTab";
import { SeriesGenresTab } from "./tabs/SeriesGenresTab";
import { SeriesReview } from "../../services/reviews";
import { useRef, useEffect, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface SeriesDetailsTabsProps {
  series: any;
  reviews: SeriesReview[];
  userReview?: SeriesReview;
  currentUser: any | null;
  userData: { photoURL?: string | null } | null;
  seriesId: string;
  onSeasonSelect: (season: number) => void;
  onOpenReviewModal: () => void;
  onSetExistingReview: (review: SeriesReview) => void;
  onSetDeleteAlertOpen: (isOpen: boolean) => void;
  onSetSeasonToDelete: (season: number | null) => void;
  onReviewClick: (review: any) => void;
  navigate: (path: string) => void;
}

export function SeriesDetailsTabs({
  series,
  reviews,
  userReview,
  currentUser,
  userData,
  seriesId,
  onSeasonSelect,
  onOpenReviewModal,
  onSetExistingReview,
  onSetDeleteAlertOpen,
  onSetSeasonToDelete,
  onReviewClick,
  navigate,
}: SeriesDetailsTabsProps) {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const tabListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar se o scroll é possível
  const checkScroll = () => {
    if (!tabListRef.current) return;
    
    const tabList = tabListRef.current;
    setCanScrollLeft(tabList.scrollLeft > 0);
    setCanScrollRight(tabList.scrollLeft < tabList.scrollWidth - tabList.clientWidth);
  };

  // Scrollar para a esquerda ou direita
  const handleScroll = (direction: 'left' | 'right') => {
    if (!tabListRef.current) return;
    
    const tabList = tabListRef.current;
    const scrollAmount = 150; // Pode ajustar conforme necessário
    
    if (direction === 'left') {
      tabList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      tabList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Configuração do comportamento de scroll horizontal para dispositivos móveis
  useEffect(() => {
    if (isMobile && tabListRef.current) {
      const tabList = tabListRef.current;
      
      // Verificar scroll inicial
      checkScroll();
      
      // Adicionar listener para detecção de scroll
      tabList.addEventListener('scroll', checkScroll);
      
      return () => {
        tabList.removeEventListener('scroll', checkScroll);
      };
    }
  }, [isMobile]);

  // Reverifcar quando o tamanho da tela muda
  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <Box width="100%">
      <Tabs variant="enclosed" colorScheme="primary" size="sm">
        {isMobile && (
          <Flex justify="flex-end" mb={1} px={2}>
            <Box fontSize="xs" color="gray.400" mr={2} alignSelf="center">
              {canScrollLeft || canScrollRight ? "Deslize para ver mais" : ""}
            </Box>
            <IconButton
              aria-label="Rolar para a esquerda"
              icon={<CaretLeft />}
              size="sm"
              variant="ghost"
              colorScheme="primary"
              isDisabled={!canScrollLeft}
              onClick={() => handleScroll('left')}
            />
            <IconButton
              aria-label="Rolar para a direita"
              icon={<CaretRight />}
              size="sm"
              variant="ghost"
              colorScheme="primary"
              isDisabled={!canScrollRight}
              onClick={() => handleScroll('right')}
            />
          </Flex>
        )}
        
        <TabList 
          borderBottomColor="gray.700" 
          ref={tabListRef}
          overflowX="auto"
          overflowY="hidden"
          css={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            WebkitOverflowScrolling: 'touch',
            whiteSpace: 'nowrap'
          }}
          pb={2}
        >
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
            minW={isMobile ? "auto" : undefined}
            px={isMobile ? 3 : 4}
            fontSize={isMobile ? "sm" : "md"}
          >
            Temporadas
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
            minW={isMobile ? "auto" : undefined}
            px={isMobile ? 3 : 4}
            fontSize={isMobile ? "sm" : "md"}
          >
            Detalhes
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
            minW={isMobile ? "auto" : undefined}
            px={isMobile ? 3 : 4}
            fontSize={isMobile ? "sm" : "md"}
          >
            Elenco
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
            minW={isMobile ? "auto" : undefined}
            px={isMobile ? 3 : 4}
            fontSize={isMobile ? "sm" : "md"}
          >
            Gêneros
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
            minW={isMobile ? "auto" : undefined}
            px={isMobile ? 3 : 4}
            fontSize={isMobile ? "sm" : "md"}
          >
            Onde Assistir
          </Tab>
        </TabList>

        <TabPanels>
          {/* Painel de Temporadas */}
          <TabPanel px={0}>
            <SeasonsTabs
              series={series}
              reviews={reviews}
              userReview={userReview}
              currentUser={currentUser}
              userData={userData}
              seriesId={seriesId}
              onSeasonSelect={onSeasonSelect}
              onOpenReviewModal={onOpenReviewModal}
              onSetExistingReview={onSetExistingReview}
              onSetDeleteAlertOpen={onSetDeleteAlertOpen}
              onSetSeasonToDelete={onSetSeasonToDelete}
              onReviewClick={onReviewClick}
              navigate={navigate}
            />
          </TabPanel>

          {/* Painel de Detalhes */}
          <TabPanel px={0}>
            <SeriesDetailsTab series={series} />
          </TabPanel>

          {/* Painel de Elenco */}
          <TabPanel px={0}>
            <SeriesCastTab series={series} />
          </TabPanel>
          
          {/* Painel de Gêneros */}
          <TabPanel px={0}>
            <SeriesGenresTab series={series} />
          </TabPanel>

          {/* Painel de Onde Assistir */}
          <TabPanel px={0}>
            <SeriesWatchProvidersTab series={series} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 