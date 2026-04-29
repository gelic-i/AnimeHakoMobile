// anime.test.ts - Unit tests for anime data handling

interface Anime {
  id: number;
  title: string;
  title_en: string | null;
  title_jp?: string | null;
  poster: string | null;
  cover?: string | null;
  description: string | null;
  rating: number | null;
  year: number | null;
  episodes: number | null;
  genres: string[];
  tags?: string[];
}

interface UserAnimeItem {
  anime_id: number;
  status: 'watching' | 'completed' | 'dropped' | 'planned' | null;
  score: number | null;
  episodes_watched: number;
  is_favorite: boolean;
  anime: {
    id: number;
    title: string;
    title_en: string | null;
    poster: string | null;
    rating: number | null;
    year: number | null;
    episodes: number | null;
    genres: string[];
  } | null;
}

const filterAnimeByStatus = (
  animeList: UserAnimeItem[],
  status: 'watching' | 'completed' | 'dropped' | 'planned'
): UserAnimeItem[] => {
  return animeList.filter((item) => item.status === status);
};

const filterAnimeByFavorites = (animeList: UserAnimeItem[]): UserAnimeItem[] => {
  return animeList.filter((item) => item.is_favorite === true);
};

const getAnimeDisplayTitle = (anime: Anime): string => {
  return anime.title_en || anime.title;
};

const getStatusCounts = (animeList: UserAnimeItem[]) => {
  return {
    watching: animeList.filter((i) => i.status === 'watching').length,
    completed: animeList.filter((i) => i.status === 'completed').length,
    dropped: animeList.filter((i) => i.status === 'dropped').length,
    planned: animeList.filter((i) => i.status === 'planned').length,
    favorites: animeList.filter((i) => i.is_favorite === true).length,
    total: animeList.length,
  };
};

describe('filterAnimeByStatus', () => {
  const mockAnimeList: UserAnimeItem[] = [
    { anime_id: 1, status: 'watching', score: 8, episodes_watched: 5, is_favorite: false, anime: null },
    { anime_id: 2, status: 'completed', score: 9, episodes_watched: 12, is_favorite: true, anime: null },
    { anime_id: 3, status: 'watching', score: 7, episodes_watched: 3, is_favorite: false, anime: null },
    { anime_id: 4, status: 'planned', score: null, episodes_watched: 0, is_favorite: false, anime: null },
  ];

  test('should filter watching anime', () => {
    const result = filterAnimeByStatus(mockAnimeList, 'watching');
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.status === 'watching')).toBe(true);
  });

  test('should filter completed anime', () => {
    const result = filterAnimeByStatus(mockAnimeList, 'completed');
    expect(result).toHaveLength(1);
    expect(result[0].anime_id).toBe(2);
  });

  test('should filter dropped anime', () => {
    const result = filterAnimeByStatus(mockAnimeList, 'dropped');
    expect(result).toHaveLength(0);
  });

  test('should filter planned anime', () => {
    const result = filterAnimeByStatus(mockAnimeList, 'planned');
    expect(result).toHaveLength(1);
    expect(result[0].anime_id).toBe(4);
  });
});

describe('filterAnimeByFavorites', () => {
  const mockAnimeList: UserAnimeItem[] = [
    { anime_id: 1, status: 'watching', score: 8, episodes_watched: 5, is_favorite: true, anime: null },
    { anime_id: 2, status: 'completed', score: 9, episodes_watched: 12, is_favorite: true, anime: null },
    { anime_id: 3, status: 'watching', score: 7, episodes_watched: 3, is_favorite: false, anime: null },
  ];

  test('should return only favorite anime', () => {
    const result = filterAnimeByFavorites(mockAnimeList);
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.is_favorite)).toBe(true);
  });
});

describe('getAnimeDisplayTitle', () => {
  test('should return title_en when available', () => {
    const anime: Anime = { id: 1, title: 'Full Metal Alchemist', title_en: 'Fullmetal Alchemist', poster: null, description: null, rating: null, year: 2003, episodes: 64, genres: [] };
    expect(getAnimeDisplayTitle(anime)).toBe('Fullmetal Alchemist');
  });

  test('should return title when title_en is null', () => {
    const anime: Anime = { id: 1, title: 'Attack on Titan', title_en: null, poster: null, description: null, rating: null, year: 2013, episodes: 25, genres: [] };
    expect(getAnimeDisplayTitle(anime)).toBe('Attack on Titan');
  });

  test('should return title when title_en is empty string', () => {
    const anime: Anime = { id: 1, title: 'One Piece', title_en: '', poster: null, description: null, rating: null, year: 1999, episodes: null, genres: [] };
    expect(getAnimeDisplayTitle(anime)).toBe('One Piece');
  });
});

describe('getStatusCounts', () => {
  const mockAnimeList: UserAnimeItem[] = [
    { anime_id: 1, status: 'watching', score: 8, episodes_watched: 5, is_favorite: true, anime: null },
    { anime_id: 2, status: 'completed', score: 9, episodes_watched: 12, is_favorite: true, anime: null },
    { anime_id: 3, status: 'watching', score: 7, episodes_watched: 3, is_favorite: false, anime: null },
    { anime_id: 4, status: 'planned', score: null, episodes_watched: 0, is_favorite: false, anime: null },
    { anime_id: 5, status: 'dropped', score: 5, episodes_watched: 2, is_favorite: false, anime: null },
  ];

  test('should count all statuses correctly', () => {
    const counts = getStatusCounts(mockAnimeList);
    expect(counts.watching).toBe(2);
    expect(counts.completed).toBe(1);
    expect(counts.planned).toBe(1);
    expect(counts.dropped).toBe(1);
    expect(counts.favorites).toBe(2);
    expect(counts.total).toBe(5);
  });

  test('should return 0 for all counts with empty array', () => {
    const counts = getStatusCounts([]);
    expect(counts.watching).toBe(0);
    expect(counts.completed).toBe(0);
    expect(counts.dropped).toBe(0);
    expect(counts.planned).toBe(0);
    expect(counts.favorites).toBe(0);
    expect(counts.total).toBe(0);
  });
});