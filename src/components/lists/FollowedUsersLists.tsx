import { useQuery } from "@tanstack/react-query";
import { getFollowedUsersLists } from "../../services/lists";
import { useAuth } from "../../contexts/AuthContext";
import { SectionBase } from "../common/SectionBase";
import { Carousel } from "../common/Carousel";
import { ListCard } from "./ListCard";
import { ListCarouselSkeleton } from "./ListCarouselSkeleton";

/** Listas de quem o usuário segue. Some da página quando não há nenhuma. */
export function FollowedUsersLists() {
  const { currentUser } = useAuth();
  const {
    data: lists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["followedUsersLists"],
    queryFn: () => getFollowedUsersLists(12),
    enabled: !!currentUser,
    staleTime: 1000 * 60,
  });

  if (!currentUser || (!isLoading && lists.length === 0)) return null;

  return (
    <SectionBase
      eyebrow="Seguindo"
      title="Listas de quem você segue"
      link="/lists"
      isLoading={isLoading}
      error={error as Error | null}
      loadingElement={<ListCarouselSkeleton />}
      renderContent={() => (
        <Carousel preset="lists" gap={4} label="Listas de quem você segue">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </Carousel>
      )}
    />
  );
}
