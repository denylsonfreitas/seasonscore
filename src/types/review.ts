import { FieldValue } from "firebase/firestore";

export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  content: string;
  createdAt: Date;
  reactions: {
    likes: string[]; // array de userIds que deram like
    dislikes: string[]; // array de userIds que deram dislike
  };
}

export interface SeasonReview {
  seasonNumber: number;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  comments?: Comment[];
  createdAt: Date | { seconds: number } | FieldValue;
  reactions?: {
    likes: string[];
    dislikes: string[];
  };
} 