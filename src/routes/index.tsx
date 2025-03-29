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
    // Se o usuário não estiver logado, redirecionar para a home
    if (!currentUser) {
      navigate("/");
      return;
    }
    
    // Se tivermos o username no objeto currentUser, usar ele diretamente
    if (currentUser.username) {
      navigate(`/u/${currentUser.username}`);
      return;
    }
    
    // Criar uma variável local que o TypeScript reconhece como não-nula
    const userId = currentUser.uid;
    
    // Se o currentUser existir mas o username não estiver disponível ainda
    // (isso pode ocorrer logo após o login enquanto os dados estão sincronizando)
    // buscar os dados do usuário diretamente do Firestore
    async function fetchUserData() {
      try {
        const userData = await getUserData(userId);
        if (userData?.username) {
          navigate(`/u/${userData.username}`);
        } else {
          // Apenas em último caso, redirecionar para settings
          navigate("/settings");
        }
      } catch (error) {
        // Em caso de erro, redirecionar para settings
        navigate("/settings");
      }
    }
    
    fetchUserData();
  }, [currentUser, navigate]);
  
  // Exibir um loader enquanto os redirecionamentos estão em andamento
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
