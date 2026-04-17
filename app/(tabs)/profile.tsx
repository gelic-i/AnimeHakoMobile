import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL, STORAGE_KEYS } from "../../config";
import { AnimeListItem, AnimeStatus, STATUS_LABELS, User } from "../../types";

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userAnime, setUserAnime] = useState<AnimeListItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    "watching" | "completed" | "dropped" | "planned" | "favorites"
  >("watching");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, animeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/me`, { headers }),
        fetch(`${API_BASE_URL}/user/anime`, { headers }),
      ]);

      if (profileRes.status === 401) {
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        router.replace("/auth/login");
        return;
      }

      const profileData = await profileRes.json();
      const animeData = await animeRes.json();

      setUser(profileData);
      setUserAnime(Array.isArray(animeData) ? animeData : (animeData.data || []));

      console.log("📊 Загружено аниме в профиле:", animeData.data?.length || 0);
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Профиль в фокусе, обновляем данные...");
      loadProfile();
    }, [loadProfile]),
  );

  const handleLogout = async () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // Фильтруем аниме в зависимости от выбранной вкладки
  const getFilteredAnime = () => {
    if (activeTab === "favorites") {
      return userAnime.filter((item) => item.isFavorite === true);
    }
    return userAnime.filter((item) => item.status === activeTab);
  };

  const filteredAnime = getFilteredAnime();

  const statusCounts = {
    watching: userAnime.filter((i) => i.status === "watching").length,
    completed: userAnime.filter((i) => i.status === "completed").length,
    dropped: userAnime.filter((i) => i.status === "dropped").length,
    planned: userAnime.filter((i) => i.status === "planned").length,
    favorites: userAnime.filter((i) => i.isFavorite === true).length,
  };

  const updateAnimeStatus = async (animeId: number, newStatus: AnimeStatus) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const response = await fetch(`${API_BASE_URL}/user/anime/${animeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        console.log("✅ Статус обновлён, перезагружаем профиль");
        loadProfile();
      }
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
            console.log("✅ Аниме удалено, перезагружаем профиль");
            loadProfile();
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
      console.log("✅ Удалено из избранного, перезагружаем профиль");
      loadProfile();
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
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
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userAnime.length}</Text>
          <Text style={styles.statLabel}>Всего</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statusCounts.completed}</Text>
          <Text style={styles.statLabel}>Просмотрено</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statusCounts.watching}</Text>
          <Text style={styles.statLabel}>Смотрю</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "watching" && styles.activeTab]}
          onPress={() => setActiveTab("watching")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "watching" && styles.activeTabText,
            ]}
          >
            📺 {STATUS_LABELS.watching} ({statusCounts.watching})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            ✅ {STATUS_LABELS.completed} ({statusCounts.completed})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "dropped" && styles.activeTab]}
          onPress={() => setActiveTab("dropped")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "dropped" && styles.activeTabText,
            ]}
          >
            ❌ {STATUS_LABELS.dropped} ({statusCounts.dropped})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "planned" && styles.activeTab]}
          onPress={() => setActiveTab("planned")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "planned" && styles.activeTabText,
            ]}
          >
            📅 {STATUS_LABELS.planned} ({statusCounts.planned})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => setActiveTab("favorites")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "favorites" && styles.activeTabText,
            ]}
          >
            ❤️ Избранное ({statusCounts.favorites})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredAnime.length === 0 ? (
        <View style={styles.emptyList}>
          <Text style={styles.emptyText}>
            {activeTab === "favorites"
              ? "Нет любимых аниме"
              : `Нет аниме в списке "${STATUS_LABELS[activeTab as AnimeStatus] || "Избранное"}"`}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === "favorites"
              ? "Нажмите на сердечко в карточке аниме, чтобы добавить его в любимое"
              : 'Добавьте аниме из карточки, нажав "Добавить в список"'}
          </Text>
        </View>
      ) : (
        filteredAnime.map((item) => (
          <TouchableOpacity
            key={item.animeId}
            style={styles.animeItem}
            onPress={() => router.push(`/anime/${item.animeId}`)}
          >
            <View style={styles.animeInfo}>
              <Text style={styles.animeTitle}>{item.anime?.title || `Аниме #${item.animeId}`}</Text>
              <View style={styles.animeDetails}>
                <Text style={styles.score}>Оценка: {item.score || "—"}</Text>
                <Text style={styles.episodes}>
                  Эпизодов: {item.episodesWatched}
                </Text>
                {item.isFavorite && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>❤️ Любимое</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.animeActions}>
              {activeTab !== "favorites" && (
                <TouchableOpacity
                  onPress={() => {
                    const statuses: AnimeStatus[] = [
                      "watching",
                      "completed",
                      "dropped",
                      "planned",
                    ];
                    const currentIndex = statuses.indexOf(item.status);
                    const nextStatus =
                      statuses[(currentIndex + 1) % statuses.length];
                    updateAnimeStatus(item.animeId, nextStatus);
                  }}
                  style={styles.statusButton}
                >
                  <Text style={styles.statusButtonText}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </TouchableOpacity>
              )}
              {activeTab === "favorites" && (
                <TouchableOpacity
                  onPress={() => removeFromFavorites(item.animeId)}
                  style={styles.removeFavoriteButton}
                >
                  <Ionicons name="heart-dislike" size={20} color="#ef4444" />
                  <Text style={styles.removeFavoriteText}>Убрать</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => removeFromList(item.animeId)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
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
  header: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  username: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  email: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6366f1",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 8,
    margin: 2,
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    fontSize: 12,
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyList: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  emptySubtext: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  animeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  animeInfo: {
    flex: 1,
  },
  animeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  animeDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 12,
  },
  score: {
    fontSize: 13,
    color: "#f59e0b",
  },
  episodes: {
    fontSize: 13,
    color: "#64748b",
  },
  favoriteBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  favoriteBadgeText: {
    fontSize: 10,
    color: "#ef4444",
  },
  animeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusButton: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusButtonText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
  },
  removeFavoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  removeFavoriteText: {
    fontSize: 11,
    color: "#ef4444",
  },
  deleteButton: {
    padding: 4,
  },
});
