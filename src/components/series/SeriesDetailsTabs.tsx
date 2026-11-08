import type { Series } from "../../services/tmdb";
import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { SeriesDetailsTab } from "./tabs/SeriesDetailsTab";
import { SeriesWatchProvidersTab } from "./tabs/SeriesWatchProvidersTab";
import { SeriesCastTab } from "./tabs/SeriesCastTab";
import { SeriesGenresTab } from "./tabs/SeriesGenresTab";

/** Informações complementares da série em abas. */
export function SeriesDetailsTabs({ series }: { series: Series }) {
  return (
    <Box
      as="section"
      aria-labelledby="sobre"
      py={{ base: 8, md: 10 }}
      borderTop="1px solid"
      borderColor="ink.800"
    >
      <Heading as="h2" id="sobre" size="h2" mb={4}>
        Sobre a série
      </Heading>
      <Tabs variant="line" isLazy>
        <TabList
          overflowX="auto"
          overflowY="hidden"
          sx={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          <Tab whiteSpace="nowrap">Elenco</Tab>
          <Tab whiteSpace="nowrap">Onde assistir</Tab>
          <Tab whiteSpace="nowrap">Detalhes</Tab>
          <Tab whiteSpace="nowrap">Gêneros</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0} pt={6}>
            <SeriesCastTab series={series} />
          </TabPanel>
          <TabPanel px={0} pt={6}>
            <SeriesWatchProvidersTab series={series} />
          </TabPanel>
          <TabPanel px={0} pt={6}>
            <SeriesDetailsTab series={series} />
          </TabPanel>
          <TabPanel px={0} pt={6}>
            <SeriesGenresTab series={series} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
