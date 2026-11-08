import { Button, Flex, Grid, Skeleton, useDisclosure } from "@chakra-ui/react";
import { ListBullets, Plus } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getUserLists } from "../../services/lists";
import { ListCard } from "../lists/ListCard";
import { CreateListModal } from "../lists/CreateListModal";
import { EmptyState } from "../common/EmptyState";

interface ListsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ListsSection({ userId, isOwnProfile }: ListsSectionProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["profileLists", userId, isOwnProfile],
    queryFn: () => getUserLists(userId, !isOwnProfile),
    enabled: !!userId,
  });

  const handleListCreated = (listId: string) => {
    queryClient.invalidateQueries({ queryKey: ["profileLists", userId] });
    queryClient.invalidateQueries({ queryKey: ["userLists", userId] });
    navigate(`/list/${listId}`);
  };

  const grid = { base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" };

  return (
    <>
      {isOwnProfile && lists.length > 0 && (
        <Flex justify="flex-end" mb={4}>
          <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={onOpen}>
            Nova lista
          </Button>
        </Flex>
      )}

      {isLoading ? (
        <Grid templateColumns={grid} gap={4}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} h="280px" borderRadius="md" startColor="ink.900" endColor="ink.850" />
          ))}
        </Grid>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={ListBullets}
          title={isOwnProfile ? "Você ainda não criou nenhuma lista." : "Nenhuma lista pública."}
          description={
            isOwnProfile
              ? "Junte séries por tema, humor ou o que fizer sentido para você."
              : undefined
          }
          action={
            isOwnProfile ? (
              <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={onOpen}>
                Criar lista
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Grid templateColumns={grid} gap={4}>
          {lists.map((list) => (
            <ListCard key={list.id} list={list} showUser={false} />
          ))}
        </Grid>
      )}

      <CreateListModal isOpen={isOpen} onClose={onClose} onListCreated={handleListCreated} />
    </>
  );
}
