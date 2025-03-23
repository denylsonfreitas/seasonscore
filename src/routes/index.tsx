import { Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Box, Spinner, Center } from "@chakra-ui/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function ProfileRedirect() {
  const { currentUser } = useAuth();

  if (!currentUser?.username) {
    return <Navigate to="/settings" />;
  }

  return <Navigate to={`/u/${currentUser.username}`} />;
}

// Lazy loading para todos os componentes de página
const HomeLazy = React.lazy(() => import("../pages/Home").then(module => ({ default: module.Home })));
const SeriesDetailsLazy = React.lazy(() => import("../pages/SeriesDetails").then(module => ({ default: module.SeriesDetails })));
const SeriesLazy = React.lazy(() => import("../pages/Series").then(module => ({ default: module.Series })));
const ProfileLazy = React.lazy(() => import("../pages/Profile").then(module => ({ default: module.Profile })));
const PopularSeriesLazy = React.lazy(() => import("../pages/PopularSeries").then(module => ({ default: module.PopularSeries })));
const RecentSeriesLazy = React.lazy(() => import("../pages/RecentSeries").then(module => ({ default: module.RecentSeries })));
const TopRatedSeriesLazy = React.lazy(() => import("../pages/TopRatedSeries").then(module => ({ default: module.TopRatedSeries })));
const SettingsLazy = React.lazy(() => import("../pages/Settings").then(module => ({ default: module.Settings })));
const ProfileSettingsLazy = React.lazy(() => import("../pages/ProfileSettings").then(module => ({ default: module.ProfileSettings })));
const SeriesReviewsLazy = React.lazy(() => import("../pages/SeriesReviews").then(module => ({ default: module.SeriesReviews })));

// Loading fallback component
const PageLoader = () => (
  <Center minH="75vh">
    <Spinner size="xl" color="primary.500" thickness="4px" />
  </Center>
);

export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomeLazy />
          </Suspense>
        ),
      },
      {
        path: "/login",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/signup",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/series",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SeriesLazy />
          </Suspense>
        ),
      },
      {
        path: "/series/popular",
        element: (
          <Suspense fallback={<PageLoader />}>
            <PopularSeriesLazy />
          </Suspense>
        ),
      },
      {
        path: "/series/recent",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecentSeriesLazy />
          </Suspense>
        ),
      },
      {
        path: "/series/top10",
        element: (
          <Suspense fallback={<PageLoader />}>
            <TopRatedSeriesLazy />
          </Suspense>
        ),
      },
      {
        path: "/series/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SeriesDetailsLazy />
          </Suspense>
        ),
      },
      {
        path: "/series/:id/reviews",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SeriesReviewsLazy />
          </Suspense>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfileRedirect />
          </ProtectedRoute>
        ),
      },
      {
        path: "/u/:username",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfileLazy />
          </Suspense>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <SettingsLazy />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profile",
        element: (
          <ProtectedRoute>
            <ProfileSettingsLazy />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
