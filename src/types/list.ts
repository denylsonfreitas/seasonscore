import { Timestamp } from "firebase/firestore";

export interface ListItem {
  seriesId: number;
  name: string;
  poster_path: string | null;
  addedAt: Date | Timestamp;
}

export interface List {
  id: string;
  userId: string;
  title: string;
  description: string;
  items: ListItem[];
  tags: string[];
  isPublic: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
}

export interface ListWithUserData extends List {
  username?: string;
  userPhotoURL?: string | null;
  userDisplayName?: string;
  reactions?: ListReaction[];
}

export interface ListComment {
  id: string;
  listId: string;
  userId: string;
  content: string;
  createdAt: Date | Timestamp;
  likes: Record<string, boolean>;
  dislikes: Record<string, boolean>;
}

export type ListReactionType = "like" | "dislike";

export interface ListReaction {
  id: string;
  listId: string;
  userId: string;
  type: ListReactionType;
  createdAt: Date | Timestamp;
}

export interface AddToListOptions {
  listId?: string;
  createNew?: boolean;
  series: {
    id: number;
    name: string;
    poster_path: string | null;
  };
} 