import { Container, Box, Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";
import { ColorPalette } from "../../components/common/ColorPalette";
import { ColorExamples } from "../../components/design/ColorExamples";

/**
 * Página que exibe o sistema de cores do SeasonScore
 * Útil para designers e desenvolvedores consultarem a paleta oficial
 */
export function ColorSystem() {
  return (
    <Box minH="100vh" py={10} bg="gray.900">
      <Container maxW="1200px">
        <Tabs variant="soft-rounded" colorScheme="primary" mb={4}>
          <TabList>
            <Tab>Paleta de Cores</Tab>
            <Tab>Exemplos de Uso</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={6}>
              <ColorPalette />
            </TabPanel>
            <TabPanel p={0} pt={6}>
              <ColorExamples />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
} 