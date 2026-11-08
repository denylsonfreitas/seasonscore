import { Flex, Box } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "../common/Footer";
import { ResetScroll } from "../common/ResetScroll";
import { ScrollToTop } from "../common/ScrollToTop";

export function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <Flex direction="column" minH="100vh">
      <ResetScroll />
      <ScrollToTop />

      {!isAuthPage && <Navbar />}

      <Box as="main" id="conteudo" flex="1" w="100%">
        <Outlet />
      </Box>

      {!isAuthPage && <Footer />}
    </Flex>
  );
}
