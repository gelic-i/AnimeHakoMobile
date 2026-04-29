import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { API_BASE_URL, STATIC_BASE_URL, STORAGE_KEYS } from "../../config";
import ZoomableImage from "../../components/ZoomableImage";
import {
  Anime,
  AnimeStatus,
  Review,
  STATUS_LABELS,
} from "../../types";

const { width, height } = Dimensions.get("window");

const formatRating = (rating: any): string => {
  if (rating === null || rating === undefined) return "?";
  const num = typeof rating === "string" ? parseFloat(rating) : rating;
  if (isNaN(num)) return "?";
  return num.toFixed(1);
};

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userStatus, setUserStatus] = useState<AnimeStatus | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!id) return;
    console.log("🟡 loadData началась для id:", id);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log("🟡 Токен при загрузке:", token ? "есть" : "НЕТ!");

      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [animeRes, screenshotsRes, reviewsRes, userAnimeRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/anime/${id}`, { headers }),
          fetch(`${API_BASE_URL}/anime/${id}/screenshots`, { headers }),
          fetch(`${API_BASE_URL}/anime/${id}/reviews`, { headers }),
          token
            ? fetch(`${API_BASE_URL}/user/anime`, { headers })
            : Promise.resolve(null),
        ]);

      if (!animeRes.ok) throw new Error("Failed to fetch anime");
      const animeData = await animeRes.json();
      if (!screenshotsRes.ok) throw new Error("Failed to fetch screenshots");
      const screenshotsData = await screenshotsRes.json();
      if (!reviewsRes.ok) throw new Error("Failed to fetch reviews");
      const reviewsData = await reviewsRes.json();

      setAnime(animeData?.id ? animeData : null);
      setScreenshots(screenshotsData.screenshots || []);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);

      if (userAnimeRes && userAnimeRes.ok) {
        const userAnimeData = await userAnimeRes.json();
        const userEntry = Array.isArray(userAnimeData)
          ? userAnimeData.find((item: any) => item.anime_id === parseInt(id))
          : userAnimeData?.data?.find((item: any) => item.anime_id === parseInt(id));
        if (userEntry) {
          setUserStatus(userEntry.status);
          setIsFavorite(userEntry.is_favorite);
        }
      }
    } catch (error) {
      console.error("🔴 Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateAnimeStatus = async (status: AnimeStatus) => {
    console.log("🟡 ===== НАЖАТА КНОПКА СТАТУСА =====");
    console.log("🟡 Выбранный статус:", status);

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const method = userStatus ? "PATCH" : "POST";
      const url = userStatus
        ? `${API_BASE_URL}/user/anime/${id}`
        : `${API_BASE_URL}/user/anime`;

      // ИСПРАВЛЕНО: для POST используем anime_id, для PATCH только status
      const requestBody = userStatus
        ? { status }
        : { anime_id: parseInt(id), status };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setUserStatus(status);
        console.log("✅ Статус обновлён");
        loadData();
      } else {
        const data = await response.json();
        console.log("🔴 Ошибка:", data);
        alert(data.detail || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error("🔴 Ошибка:", error);
      alert("Не удалось подключиться к серверу");
    }
  };

  const toggleFavorite = async () => {
    console.log("🟡 ===== НАЖАТА КНОПКА ИЗБРАННОГО =====");

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Если аниме ещё нет в списке, сначала добавляем его
      if (!userStatus && !isFavorite) {
        console.log("🟡 Добавляем аниме в список перед избранным");
        const addResponse = await fetch(`${API_BASE_URL}/user/anime`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ anime_id: parseInt(id), status: "planned" }),
        });

        if (addResponse.ok) {
          setUserStatus("planned");
          console.log("✅ Аниме добавлено в список");
        } else {
          alert("Сначала добавьте аниме в список");
          return;
        }
      }

      const method = isFavorite ? "DELETE" : "POST";
      const url = `${API_BASE_URL}/user/favorites/${id}`;

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        console.log("✅ Избранное обновлено");
        loadData();
      } else {
        const data = await response.json();
        console.log("🔴 Ошибка:", data);
        alert(data.detail || "Ошибка при обновлении избранного");
      }
    } catch (error) {
      console.error("🔴 Ошибка:", error);
      alert("Не удалось подключиться к серверу");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!anime) {
    return (
      <View style={styles.center}>
        <Text>Аниме не найдено</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: ((anime.cover || anime.poster)?.startsWith("http://") || (anime.cover || anime.poster)?.startsWith("https://")) ? (anime.cover || anime.poster) : `${STATIC_BASE_URL}${anime.cover || anime.poster || ""}` }}
        style={styles.cover}
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{anime.title}</Text>
          {anime.title_en && <Text style={styles.title_en}>{anime.title_en}</Text>}
          {anime.title_jp && <Text style={styles.title_jp}>{anime.title_jp}</Text>}
        </View>

        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {formatRating(anime.rating)}</Text>
          <Text style={styles.year}>{anime.year}</Text>
          <Text style={styles.episodes}>{anime.episodes} эп.</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              userStatus && styles.statusButtonActive,
            ]}
            onPress={() => {
              const statuses: AnimeStatus[] = [
                "watching",
                "completed",
                "dropped",
                "planned",
              ];
              const currentIndex = userStatus
                ? statuses.indexOf(userStatus)
                : -1;
              const nextStatus = statuses[(currentIndex + 1) % statuses.length];
              updateAnimeStatus(nextStatus);
            }}
          >
            <Text
              style={[
                styles.statusButtonText,
                userStatus && styles.statusButtonTextActive,
              ]}
            >
              {userStatus ? STATUS_LABELS[userStatus] : "Добавить в список"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={28}
              color={isFavorite ? "#ef4444" : "#64748b"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          {anime.studio && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Студия:</Text>
              <Text style={styles.infoValue}>{anime.studio}</Text>
            </View>
          )}
          {anime.duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Длительность:</Text>
              <Text style={styles.infoValue}>{anime.duration} мин.</Text>
            </View>
          )}
          {anime.status && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Статус:</Text>
              <Text style={styles.infoValue}>
                {anime.status === "ongoing" ? "Онгоинг" : "Завершено"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>
            {anime.description || "Нет описания"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Жанры</Text>
          <View style={styles.chipsContainer}>
            {anime.genres?.map((genre, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => router.push({ pathname: "/(tabs)/search", params: { genre } })}
              >
                <Text style={styles.chipText}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {anime.tags && anime.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Теги</Text>
            <View style={styles.chipsContainer}>
              {anime.tags.map((tag, idx) => (
                <View key={idx} style={[styles.chip, styles.tagChip]}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {screenshots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Скриншоты</Text>
            <FlatList
              data={screenshots}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity key={index} onPress={() => setSelectedImage(item)}>
                  <Image source={{ uri: item }} style={styles.screenshot} />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => String(index)}
              contentContainerStyle={styles.screenshotsList}
            />
          </View>
        )}

        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Обзоры</Text>
            {reviews.map((review, idx) => (
              <View key={review.id ?? `review-${idx}`} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                  <Text style={styles.reviewScore}>⭐ {review.score}</Text>
                </View>
                <Text style={styles.reviewTitle}>{review.title}</Text>
                <Text style={styles.reviewContent} numberOfLines={3}>
                  {review.content}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ZoomableImage
            uri={selectedImage!}
            onClose={() => setSelectedImage(null)}
          />
        </GestureHandlerRootView>
      </Modal>
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
  },
  cover: {
    width: width,
    height: height * 0.4,
    resizeMode: "cover",
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  title_en: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  title_jp: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f59e0b",
  },
  year: {
    fontSize: 14,
    color: "#64748b",
  },
  episodes: {
    fontSize: 14,
    color: "#64748b",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statusButton: {
    flex: 1,
    backgroundColor: "#e0e7ff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: "#6366f1",
  },
  statusButtonText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  statusButtonTextActive: {
    color: "#fff",
  },
  favoriteButton: {
    padding: 8,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: "#64748b",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: "#6366f1",
    fontSize: 13,
  },
  tagChip: {
    backgroundColor: "#f1f5f9",
  },
  tagChipText: {
    color: "#475569",
  },
  screenshotsList: {
    gap: 12,
  },
  screenshot: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  reviewScore: {
    fontSize: 14,
    color: "#f59e0b",
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 8,
  },
});
