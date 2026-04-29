import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL, STORAGE_KEYS } from "../../config";
import { UserAnimeItem, AnimeStatus, STATUS_LABELS } from "../../types";

export default function MyListsScreen() {
  const [userAnime, setUserAnime] = useState<UserAnimeItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    "watching" | "completed" | "dropped" | "planned" | "favorites"
  >("watching");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE_URL}/user/anime`, { headers });
      const data = await res.json();
      setUserAnime(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getFilteredAnime = () => {
    if (activeTab === "favorites") {
      return userAnime.filter((item) => item.is_favorite === true);
    }
    return userAnime.filter((item) => item.status === activeTab);
  };

  const filteredAnime = getFilteredAnime();

  const statusCounts = {
    watching: userAnime.filter((i) => i.status === "watching").length,
    completed: userAnime.filter((i) => i.status === "completed").length,
    dropped: userAnime.filter((i) => i.status === "dropped").length,
    planned: userAnime.filter((i) => i.status === "planned").length,
    favorites: userAnime.filter((i) => i.is_favorite === true).length,
  };

  const updateStatus = async (animeId: number, newStatus: AnimeStatus) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      await fetch(`${API_BASE_URL}/user/anime/${animeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
    } catch (error) {
      console.error("Ошибка обновления:", error);
    }
  };

  const removeFromList = async (animeId: number) => {
    Alert.alert("Удалить", "Удалить аниме из списка?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
            await fetch(`${API_BASE_URL}/user/anime/${animeId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            loadData();
          } catch (error) {
            console.error("Ошибка удаления:", error);
          }
        },
      },
    ]);
  };

  const removeFromFavorites = async (animeId: number) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      await fetch(`${API_BASE_URL}/user/favorites/${animeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  const renderAnimeItem = ({ item }: { item: UserAnimeItem }) => (
    <TouchableOpacity
      style={styles.animeItem}
      onPress={() => router.push(`/anime/${item.anime_id}`)}
    >
      {item.anime?.poster && (
        <Image
          source={{ uri: (item.anime.poster || "").startsWith("http") ? item.anime.poster : `${STATIC_BASE_URL}${item.anime.poster}` }}
          style={styles.poster}
        />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.anime?.title || `Аниме #${item.anime_id}`}
        </Text>
        <View style={styles.meta}>
          {item.score && <Text style={styles.score}>⭐ {item.score}</Text>}
          <Text style={styles.episodes}>{item.episodes_watched} эп.</Text>
          {item.is_favorite && <Text style={styles.favorite}>❤️</Text>}
        </View>
      </View>
      <View style={styles.actions}>
        {activeTab !== "favorites" && (
          <TouchableOpacity
            style={styles.statusBtn}
            onPress={() => {
              const statuses: AnimeStatus[] = ["watching", "completed", "dropped", "planned"];
              const idx = statuses.indexOf(item.status || "");
              const next = statuses[(idx + 1) % statuses.length];
              if (item.status) updateStatus(item.anime_id, next);
            }}
          >
            <Text style={styles.statusBtnText}>
              {STATUS_LABELS[item.status as AnimeStatus] || "Добавить"}
            </Text>
          </TouchableOpacity>
        )}
        {activeTab === "favorites" && (
          <TouchableOpacity onPress={() => removeFromFavorites(item.anime_id)}>
            <Ionicons name="heart-dislike" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => removeFromList(item.anime_id)}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const tabsConfig = [
    { key: "watching", label: "Смотрю" },
    { key: "completed", label: "Просмотрено" },
    { key: "dropped", label: "Брошено" },
    { key: "planned", label: "Запланировано" },
    { key: "favorites", label: "Избранное" },
  ] as const;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {tabsConfig.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label} ({statusCounts[tab.key]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={filteredAnime}
        renderItem={renderAnimeItem}
        keyExtractor={(item) => String(item.anime_id ?? Math.random())}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === "favorites" ? "Нет любимых аниме" : `Нет аниме в "${tabsConfig.find(t => t.key === activeTab)?.label}"`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const STATIC_BASE_URL = "http://192.168.43.231:8000";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabsScroll: { backgroundColor: "#fff" },
  tabs: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 2,
  },
  activeTab: { backgroundColor: "#6366f1" },
  tabText: { fontSize: 12, color: "#64748b" },
  activeTabText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16 },
  animeItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  poster: { width: 60, height: 80, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  meta: { flexDirection: "row", gap: 12, marginTop: 6 },
  score: { fontSize: 13, color: "#f59e0b" },
  episodes: { fontSize: 13, color: "#64748b" },
  favorite: { fontSize: 13 },
  actions: { flexDirection: "row", gap: 12, alignItems: "center" },
  statusBtn: { backgroundColor: "#e0e7ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusBtnText: { fontSize: 11, color: "#6366f1", fontWeight: "500" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 14 },
});