import { Navigate } from "react-router-dom";
import React, { Suspense, useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Box, Spinner, Center } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../services/users";

// Loading fallback component
const PageLoader = () => (
  <Center minH="75vh">
    <Spinner size="xl" color="primary.500" thickness="4px" />
  </Center>
);

// Componente de precarregamento para rotas importantes
const PrefetchRoutes = () => {
  useEffect(() => {
    // Precarregar componentes importantes após 1 segundo
    const timer = setTimeout(() => {
      // Precarregar componentes críticos
      import("../pages/Home");
      import("../pages/SeriesDetails");
      import("../pages/Series");
    }, 1000);

    return () => clearTimeout(timer);
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

// Lazy loading com chunks nomeados para debugging mais fácil
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

const PopularSeriesLazy = React.lazy(() => 
  import(/* webpackChunkName: "popular-series" */ "../pages/PopularSeries")
    .then(module => ({ default: module.PopularSeries }))
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

// Adicionar carregamento lazy para a página de pesquisa
const SearchLazy = React.lazy(() => 
  import(/* webpackChunkName: "search" */ "../pages/Series")
    .then(module => ({ default: module.Series }))
);

// Adicionar carregamento lazy para a página de lista
const ListPageLazy = React.lazy(() => 
  import(/* webpackChunkName: "list-page" */ "../pages/ListPage")
);

// Adicionar carregamento lazy para a página NotFound (404)
const NotFoundLazy = React.lazy(() => 
  import(/* webpackChunkName: "not-found" */ "../pages/NotFound")
    .then(module => ({ default: module.NotFound }))
);

// Adicionar carregamento lazy para a página de listas
const ListsLazy = React.lazy(() => 
  import(/* webpackChunkName: "lists" */ "../pages/Lists")
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
      // Adicionar rota 404 para capturar todas as rotas inexistentes
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
