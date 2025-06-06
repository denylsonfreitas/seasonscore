import { User as FirebaseUser } from "firebase/auth";
import { UserData } from "../services/users";

export interface ExtendedUser extends FirebaseUser {
  coverURL?: string;
  description?: string;
  username?: string;
  favoriteSeries?: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
    images?: {
      logos?: Array<{
        file_path: string;
      }>;
    };
  };
  notificationSettings?: {
    newEpisode: boolean;
    newFollower: boolean;
    newComment: boolean;
    newReaction: boolean;
    newReview: boolean;
    listComment: boolean;
    listReaction: boolean;
  };
} 