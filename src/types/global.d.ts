import "@chakra-ui/react";

declare module "@chakra-ui/react" {
  export interface BoxProps {
    as?: any;
  }
}

export interface WatchlistItem {
  id: string;
  seriesId: number;
  userId: string;
  seriesName: string;
  addedAt: Date;
  seriesData: {
    name: string;
    poster_path: string;
  };
} 