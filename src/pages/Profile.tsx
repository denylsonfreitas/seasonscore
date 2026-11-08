import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserReviews, type SeriesReview } from "../services/reviews";
import { getUserWatchlist } from "../services/watchlist";
import { getFollowers, getFollowing } from "../services/followers";
import { getUserData, getUserByUsername, type UserData } from "../services/users";
import { getUserLists } from "../services/lists";
import { UserListModal } from "../components/user/UserListModal";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStats } from "../components/profile/ProfileStats";
import { ReviewsSection } from "../components/profile/ReviewsSection";
import { WatchlistSection } from "../components/profile/WatchlistSection";
import { ListsSection } from "../components/profile/ListsSection";
import { PageContainer } from "../components/layout/PageContainer";
import { SEO } from "../components/common/SEO";

type Section = "reviews" | "watchlist" | "lists";

export function Profile() {
  const { currentUser } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [section, setSection] = useState<Section>("reviews");

  const isOwnProfile = !username || (!!currentUser && profileUser?.id === currentUser.uid);
  const targetUserId = profileUser?.id || (!username ? currentUser?.uid : undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (username) {
        const user = await getUserByUsername(username);
        if (cancelled) return;
        if (user) setProfileUser(user);
        else navigate("/404", { replace: true });
      } else if (currentUser) {
        const user = await getUserData(currentUser.uid);
        if (!cancelled) setProfileUser(user);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, currentUser, navigate]);

  // Volta para a aba de avaliações ao trocar de perfil
  useEffect(() => setSection("reviews"), [username]);

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["userReviews", targetUserId],
    queryFn: () => getUserReviews(targetUserId!),
    enabled: !!targetUserId,
  });
  const { data: watchlist = [], isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ["userWatchlist", targetUserId],
    queryFn: () => getUserWatchlist(targetUserId!),
    enabled: !!targetUserId,
  });
  const { data: followers = [] } = useQuery({
    queryKey: ["followers", targetUserId],
    queryFn: () => getFollowers(targetUserId!),
    enabled: !!targetUserId,
  });
  const { data: following = [] } = useQuery({
    queryKey: ["following", targetUserId],
    queryFn: () => getFollowing(targetUserId!),
    enabled: !!targetUserId,
  });
  const { data: userLists = [] } = useQuery({
    queryKey: ["userLists", targetUserId, isOwnProfile],
    queryFn: () => getUserLists(targetUserId!, !isOwnProfile),
    enabled: !!targetUserId,
  });

  if (!currentUser && !username) {
    return (
      <PageContainer py={16}>
        <Text color="ink.300">Entre na sua conta para ver o seu perfil.</Text>
      </PageContainer>
    );
  }

  const userName = isOwnProfile
    ? currentUser?.displayName || currentUser?.username || "Usuário"
    : profileUser?.displayName || profileUser?.username || "";
  const seasonsRated = reviews.reduce((sum, r) => sum + r.seasonReviews.length, 0);

  const handleReviewClick = (review: SeriesReview) => {
    navigate(`/reviews/${review.id}/${review.selectedSeasonNumber}`);
  };

  return (
    <>
      {userName && (
        <SEO
          title={`${userName} | SeasonScore`}
          description={`Avaliações de ${userName} no SeasonScore.`}
        />
      )}
      <ProfileHeader
        isOwnProfile={isOwnProfile}
        profileUser={profileUser}
        currentUser={currentUser}
        userName={userName}
        targetUserId={targetUserId || ""}
        reviewsCount={seasonsRated}
        followersCount={followers.length}
        followingCount={following.length}
        onShowFollowers={() => setShowFollowers(true)}
        onShowFollowing={() => setShowFollowing(true)}
      />

      <PageContainer pt={{ base: 8, md: 10 }} pb={{ base: 12, md: 16 }}>
        <ProfileStats
          reviewsCount={reviews.length}
          watchlistCount={watchlist.length}
          listsCount={userLists.length}
          onShowReviews={() => setSection("reviews")}
          onShowWatchlist={() => setSection("watchlist")}
          onShowLists={() => setSection("lists")}
          isOwnProfile={isOwnProfile}
          activeSection={section}
        />

        <Box pt={6}>
          {section === "reviews" && (
            <ReviewsSection
              reviews={reviews}
              isLoading={isLoadingReviews}
              onReviewClick={handleReviewClick}
              isOwnProfile={isOwnProfile}
            />
          )}
          {section === "watchlist" && (
            <WatchlistSection
              watchlist={watchlist}
              isLoading={isLoadingWatchlist}
              isOwnProfile={isOwnProfile}
              currentUser={currentUser}
            />
          )}
          {section === "lists" && targetUserId && (
            <ListsSection userId={targetUserId} isOwnProfile={isOwnProfile} />
          )}
        </Box>
      </PageContainer>

      <UserListModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Seguidores"
        userIds={followers.map((f) => f.followerId)}
        type="followers"
      />
      <UserListModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Seguindo"
        userIds={following.map((f) => f.userId)}
        type="following"
      />
    </>
  );
}
