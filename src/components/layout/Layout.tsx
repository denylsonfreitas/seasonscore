import { Box } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <Box>
      {!isAuthPage && <Navbar />}
      <Box>
        <Outlet />
      </Box>
    </Box>
  );
}
