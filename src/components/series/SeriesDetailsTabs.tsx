import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Box,
} from "@chakra-ui/react";
import { SeasonsTabs } from "./SeasonsTabs";
import { SeriesDetailsTab } from "./tabs/SeriesDetailsTab";
import { SeriesWatchProvidersTab } from "./tabs/SeriesWatchProvidersTab";
import { SeriesCastTab } from "./tabs/SeriesCastTab";
import { SeriesReview } from "../../services/reviews";

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
  return (
    <Box width="100%">
      <Tabs variant="enclosed" colorScheme="teal" size="sm">
        <TabList borderBottomColor="gray.700">
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
          >
            Temporadas
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
          >
            Detalhes
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
          >
            Onde Assistir
          </Tab>
          <Tab
            color="gray.400"
            _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
          >
            Elenco
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

          {/* Painel de Onde Assistir */}
          <TabPanel px={0}>
            <SeriesWatchProvidersTab series={series} />
          </TabPanel>

          {/* Painel de Elenco */}
          <TabPanel px={0}>
            <SeriesCastTab series={series} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 