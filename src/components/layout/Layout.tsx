import { Box } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { ResetScroll } from "../common/ResetScroll";
import { ScrollToTop } from "../common/ScrollToTop";

export function Layout() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <Box minH="100vh" position="relative">
      <div
        id="top"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "1px",
        }}
      />

      <ResetScroll />
      <ScrollToTop />

      {!isAuthPage && <Navbar />}

      <Box w="100%">
        <Outlet />
      </Box>
    </Box>
  );
}
