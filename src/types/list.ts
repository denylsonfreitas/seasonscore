export interface ListItem {
  seriesId: number;
  name: string;
  poster_path: string | null;
  addedAt: Date;
}

export interface List {
  id: string;
  userId: string;
  title: string;
  description: string;
  items: ListItem[];
  tags: string[];
  isPublic: boolean;
  accessByLink: boolean;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
}

export interface ListWithUserData extends List {
  username?: string;
  userPhotoURL?: string | null;
  userDisplayName?: string;
  reactions?: ListReaction[];
  coverImage?: string | null;
}

export type ListReactionType = "like";

export interface ListReaction {
  id: string;
  listId: string;
  userId: string;
  type: ListReactionType;
  createdAt: Date;
}
