import { User as FirebaseUser } from "firebase/auth";
import { UserData } from "../services/users";

export interface ExtendedUser extends FirebaseUser {
  coverURL?: string;
  description?: string;
  favoriteSeries?: {
    id: number;
    name: string;
    poster_path: string;
  };
} 