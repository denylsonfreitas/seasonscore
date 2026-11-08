import { useQuery } from "@tanstack/react-query";
import { getPopularLists } from "../../services/lists";
import { SectionBase } from "../common/SectionBase";
import { Carousel } from "../common/Carousel";
import { ListCard } from "./ListCard";
import { ListCarouselSkeleton } from "./ListCarouselSkeleton";

export function PopularLists() {
  const {
    data: lists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["popularLists"],
    queryFn: () => getPopularLists(12),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <SectionBase
      eyebrow="Listas"
      title="Listas populares"
      link="/lists"
      isLoading={isLoading}
      error={error as Error | null}
      isEmpty={lists.length === 0}
      emptyMessage="Nenhuma lista popular ainda."
      emptyDescription="Listas curtidas pela comunidade aparecem aqui."
      loadingElement={<ListCarouselSkeleton />}
      renderContent={() => (
        <Carousel preset="lists" gap={4} label="Listas populares">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </Carousel>
      )}
    />
  );
}
