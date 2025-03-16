import { Navigate } from "react-router-dom";
import { Home } from "../pages/Home";
import { Login } from "../pages/Login";
import { SignUp } from "../pages/SignUp";
import { SeriesDetails } from "../pages/SeriesDetails";
import { Series } from "../pages/Series";
import { Profile } from "../pages/Profile";
import { PopularSeries } from "../pages/PopularSeries";
import { RecentSeries } from "../pages/RecentSeries";
import { TopRatedSeries } from "../pages/TopRatedSeries";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/layout/Layout";
import { Settings } from "../pages/Settings";
import { ProfileSettings } from "../pages/ProfileSettings";
import { SeriesReviews } from "../pages/SeriesReviews";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
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

export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <SignUp />,
      },
      {
        path: "/series",
        element: <Series />,
      },
      {
        path: "/series/popular",
        element: <PopularSeries />,
      },
      {
        path: "/series/recent",
        element: <RecentSeries />,
      },
      {
        path: "/series/top10",
        element: <TopRatedSeries />,
      },
      {
        path: "/series/:id",
        element: <SeriesDetails />,
      },
      {
        path: "/series/:id/reviews",
        element: <SeriesReviews />,
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
        element: <Profile />,
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profile",
        element: (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
