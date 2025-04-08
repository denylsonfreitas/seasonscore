import { Navigate } from "react-router-dom";
import React, { Suspense, useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Box, Spinner, Center } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../services/users";

const PageLoader = () => (
  <Center minH="75vh">
    <Spinner size="xl" color="primary.500" thickness="4px" />
  </Center>
);

const PrefetchRoutes = () => {
  useEffect(() => {
    // Prefetch apenas das rotas mais acessadas
    const prefetchRoutes = async () => {
      try {
        // Prefetch imediato para rotas críticas
        await Promise.all([
          import("../pages/Home"),
          import("../pages/Series")
        ]);

        // Prefetch com delay para rotas secundárias
        setTimeout(() => {
          import("../pages/SeriesDetails");
          import("../pages/ActorDetails");
        }, 2000);
      } catch (error) {
        console.error("Erro ao prefetch rotas:", error);
      }
    };

    prefetchRoutes();
  }, []);

  return null;
};

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    
    if (currentUser.username) {
      navigate(`/u/${currentUser.username}`);
      return;
    }
    
    const userId = currentUser.uid;
    
    async function fetchUserData() {
      try {
        const userData = await getUserData(userId);
        if (userData?.username) {
          navigate(`/u/${userData.username}`);
        } else {
          navigate("/settings");
        }
      } catch (error) {
        navigate("/settings");
      }
    }
    
    fetchUserData();
  }, [currentUser, navigate]);
  
  return <PageLoader />;
}

const HomeLazy = React.lazy(() => 
  import(/* webpackChunkName: "home" */ "../pages/Home")
    .then(module => ({ default: module.Home }))
);

const SeriesDetailsLazy = React.lazy(() => 
  import(/* webpackChunkName: "series-details" */ "../pages/SeriesDetails")
    .then(module => ({ default: module.SeriesDetails }))
);

const SeriesLazy = React.lazy(() => 
  import(/* webpackChunkName: "series" */ "../pages/Series")
    .then(module => ({ default: module.Series }))
);

const ProfileLazy = React.lazy(() => 
  import(/* webpackChunkName: "profile" */ "../pages/Profile")
    .then(module => ({ default: module.Profile }))
);

const RecentSeriesLazy = React.lazy(() => 
  import(/* webpackChunkName: "recent-series" */ "../pages/RecentSeries")
    .then(module => ({ default: module.RecentSeries }))
);

const TopRatedSeriesLazy = React.lazy(() => 
  import(/* webpackChunkName: "top-rated-series" */ "../pages/TopRatedSeries")
    .then(module => ({ default: module.TopRatedSeries }))
);

const SettingsLazy = React.lazy(() => 
  import(/* webpackChunkName: "settings" */ "../pages/Settings")
    .then(module => ({ default: module.Settings }))
);

const ProfileSettingsLazy = React.lazy(() => 
  import(/* webpackChunkName: "profile-settings" */ "../pages/ProfileSettings")
    .then(module => ({ default: module.ProfileSettings }))
);

const SeriesReviewsLazy = React.lazy(() => 
  import(/* webpackChunkName: "series-reviews" */ "../pages/SeriesReviews")
    .then(module => ({ default: module.SeriesReviews }))
);

const ReviewsLazy = React.lazy(() => 
  import(/* webpackChunkName: "reviews" */ "../pages/Reviews")
    .then(module => ({ default: module.Reviews }))
);

const SearchLazy = React.lazy(() => 
  import(/* webpackChunkName: "search" */ "../pages/Series")
    .then(module => ({ default: module.Series }))
);

const ListPageLazy = React.lazy(() => 
  import(/* webpackChunkName: "list-page" */ "../pages/ListPage")
);

const NotFoundLazy = React.lazy(() => 
  import(/* webpackChunkName: "not-found" */ "../pages/NotFound")
    .then(module => ({ default: module.NotFound }))
);

const ListsLazy = React.lazy(() => 
  import(/* webpackChunkName: "lists" */ "../pages/Lists")
);

const ActorDetailsLazy = React.lazy(() => 
  import(/* webpackChunkName: "actor-details" */ "../pages/ActorDetails")
    .then(module => ({ default: module.ActorDetails }))
);

const CommunityLazy = React.lazy(() => 
  import(/* webpackChunkName: "community" */ "../pages/Community")
    .then(module => ({ default: module.Community }))
);

export const routes = [
  {
    path: "/",
    element: (
      <>
        <Layout />
        <Suspense fallback={null}>
          <PrefetchRoutes />
        </Suspense>
      </>
    ),
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
            <Navigate to="/community" replace />
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
        path: "/reviews",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReviewsLazy />
          </Suspense>
        ),
      },
      {
        path: "/lists",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ListsLazy />
          </Suspense>
        ),
      },
      {
        path: "/list/:listId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ListPageLazy />
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
      {
        path: "/search",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SearchLazy />
          </Suspense>
        ),
      },
      {
        path: "/lists/:listId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ListPageLazy />
          </Suspense>
        ),
      },
      {
        path: "/actor/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ActorDetailsLazy />
          </Suspense>
        ),
      },
      {
        path: "/community",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CommunityLazy />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundLazy />
          </Suspense>
        ),
      },
    ],
  },
];
