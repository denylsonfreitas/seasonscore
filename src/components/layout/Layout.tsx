import { Box } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <Box minH="100vh" position="relative">
      {!isAuthPage && <Navbar />}
      <Box w="100%">
        <Outlet />
      </Box>
    </Box>
  );
}
