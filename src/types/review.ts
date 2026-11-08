export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  content: string;
  createdAt: Date;
  reactions: {
    likes: string[]; // array de userIds que deram like
  };
}

export interface SeasonReview {
  seasonNumber: number;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  /** O autor marcou que o texto revela acontecimentos da temporada. */
  hasSpoiler?: boolean;
  comments?: Comment[];
  createdAt: Date | { seconds: number };
  reactions?: {
    likes: string[];
  };
}

/** Dados mínimos para navegar até os detalhes de uma avaliação de temporada. */
export interface ReviewTarget {
  id: string;
  seasonNumber: number;
}

export type ReviewClickHandler = (review: ReviewTarget) => void;
