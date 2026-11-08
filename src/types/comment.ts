/** Comentário em uma avaliação ou lista (coleções reviewComments e listComments). */
export interface Comment {
  id: string;
  objectId: string;
  objectType: string;
  userId: string;
  username: string;
  userEmail?: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  content: string;
  seasonNumber?: number;
  likes?: Record<string, boolean>;
  createdAt: Date;
  updatedAt?: Date;
}
