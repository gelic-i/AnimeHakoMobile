import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AnimeImage from "../../components/AnimeImage";
import { API_BASE_URL, STATIC_BASE_URL, STORAGE_KEYS } from "../../config";
import { Anime } from "../../types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

// Функция для безопасного форматирования рейтинга
const formatRating = (rating: any): string => {
  if (rating === null || rating === undefined) return "?";
  const num = typeof rating === "string" ? parseFloat(rating) : rating;
  if (isNaN(num)) return "?";
  return num.toFixed(1);
};

// Функция для получения полного URL картинки с бекенда
const getFullImageUrl = (url: string): string => {
  if (!url) return "";

  // Если URL уже полный (начинается с http), возвращаем как есть
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Если URL начинается с /static, добавляем базовый URL бекенда
  if (url.startsWith("/static")) {
    return `${STATIC_BASE_URL}${url}`;
  }

  // Если просто путь, тоже добавляем базовый URL
  return `${STATIC_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function HomeScreen() {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [newAnime, setNewAnime] = useState<Anime[]>([]);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingPage, setTrendingPage] = useState(1);
  const [newPage, setNewPage] = useState(1);
  const [topPage, setTopPage] = useState(1);
  const [trendingHasMore, setTrendingHasMore] = useState(true);
  const [newHasMore, setNewHasMore] = useState(true);
  const [topHasMore, setTopHasMore] = useState(true);
  const router = useRouter();

  const loadSection = async (
    sort: string,
    page: number,
    setData: React.Dispatch<React.SetStateAction<Anime[]>>,
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/anime?page=${page}&limit=10&sort=${sort}`,
        { headers },
      );
      const data = await res.json();
      const newItems = data.data || [];
      setData((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
      setHasMore(newItems.length === 10);
    } catch (error) {
      console.error("Ошибка загрузки секции:", error);
    }
  };

  const loadData = async () => {
    try {
      setTrendingPage(1);
      setNewPage(1);
      setTopPage(1);
      await Promise.all([
        loadSection("rating", 1, setTrendingAnime, setTrendingHasMore),
        loadSection("year", 1, setNewAnime, setNewHasMore),
        loadSection("rating", 1, setTopRated, setTopHasMore),
      ]);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreTrending = () => {
    if (!loading && trendingHasMore) {
      const nextPage = trendingPage + 1;
      setTrendingPage(nextPage);
      loadSection("rating", nextPage, setTrendingAnime, setTrendingHasMore);
    }
  };

  const loadMoreNew = () => {
    if (!loading && newHasMore) {
      const nextPage = newPage + 1;
      setNewPage(nextPage);
      loadSection("year", nextPage, setNewAnime, setNewHasMore);
    }
  };

  const loadMoreTop = () => {
    if (!loading && topHasMore) {
      const nextPage = topPage + 1;
      setTopPage(nextPage);
      loadSection("rating", nextPage, setTopRated, setTopHasMore);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderAnimeCard = ({ item }: { item: Anime }) => {
    // Получаем полный URL картинки с бекенда
    const imageUrl = getFullImageUrl(item.poster);
    console.log("Картинка URL:", imageUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/anime/${item.id}`)}
        activeOpacity={0.8}
      >
        <AnimeImage uri={imageUrl} style={styles.poster} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.rating}>{formatRating(item.rating)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (
    title: string,
    data: Anime[],
    onEndReached: () => void,
    hasMore: boolean,
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={renderAnimeCard}
        keyExtractor={(item) => `card-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator style={styles.loader} color="#6366f1" />
          ) : null
        }
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Загрузка аниме...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderSection(
        "🔥 Популярное",
        trendingAnime,
        loadMoreTrending,
        trendingHasMore,
      )}
      {renderSection("🆕 Новинки", newAnime, loadMoreNew, newHasMore)}
      {renderSection("⭐ Топ рейтинга", topRated, loadMoreTop, topHasMore)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    color: "#1e293b",
  },
  carousel: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  poster: {
    width: "100%",
    height: CARD_WIDTH * 1.4,
    backgroundColor: "#e2e8f0",
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    minHeight: 40,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  star: {
    fontSize: 12,
    marginRight: 4,
  },
  loader: {
    marginLeft: 12,
    paddingVertical: 20,
  },
  rating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f59e0b",
  },
});
