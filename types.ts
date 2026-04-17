// types.ts
export interface User {
  id: number;
  email: string;
  username: string;
  avatar: string | null;
}

export interface Anime {
  id: number;
  title: string;
  titleEn: string;
  titleJp?: string;
  poster: string;
  cover?: string;
  description: string;
  rating: number;
  year: number;
  season?: string;
  status: string;
  episodes: number;
  duration?: number;
  studio?: string;
  genres: string[];
  tags?: string[];
}

export interface AnimeListItem {
  animeId: number;
  status: "watching" | "completed" | "dropped" | "planned";
  score: number;
  episodesWatched: number;
  isFavorite: boolean;
  anime?: {
    id: number;
    title: string;
    titleEn?: string;
    poster?: string;
    rating?: number;
    year?: number;
    episodes?: number;
    genres?: string[];
  };
}

export interface Screenshot {
  id: number;
  url: string;
}

export interface Review {
  id: number;
  animeId: number;
  authorName: string;
  title: string;
  content: string;
  score: number;
  createdAt: string;
}

export type AnimeStatus = "watching" | "completed" | "dropped" | "planned";

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  watching: "Смотрю",
  completed: "Просмотрено",
  dropped: "Брошено",
  planned: "Запланировано",
};
