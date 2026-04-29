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
  title_en: string | null;
  title_jp?: string | null;
  poster: string | null;
  cover?: string | null;
  description: string | null;
  rating: number | null;
  year: number | null;
  season?: string | null;
  status?: string | null;
  episodes: number | null;
  duration?: number | null;
  studio?: string | null;
  genres: string[];
  tags?: string[];
}

export interface AnimeListItem {
  id: number;
  title: string;
  title_en: string | null;
  poster: string | null;
  rating: number | null;
  year: number | null;
  episodes: number | null;
  genres: string[];
}

export interface UserAnimeItem {
  anime_id: number;
  status: "watching" | "completed" | "dropped" | "planned" | null;
  score: number | null;
  episodes_watched: number;
  is_favorite: boolean;
  anime: AnimeListItem | null;
}

export interface Review {
  id: number;
  anime_id: number;
  author_name: string;
  title: string;
  content: string;
  score: number | null;
  created_at: string;
}

export type AnimeStatus = "watching" | "completed" | "dropped" | "planned";

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  watching: "Смотрю",
  completed: "Просмотрено",
  dropped: "Брошено",
  planned: "Запланировано",
};