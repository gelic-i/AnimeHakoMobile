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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL, STORAGE_KEYS } from "../../config";
import { User } from "../../types";

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userAnimeCount, setUserAnimeCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [watchingCount, setWatchingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
      const animeList = Array.isArray(animeData) ? animeData : [];

      setUser(profileData);
      setUsername(profileData.username || "");
      setAvatarUrl(profileData.avatar || "");
      setUserAnimeCount(animeList.length);
      setCompletedCount(animeList.filter((i: any) => i.status === "completed").length);
      setWatchingCount(animeList.filter((i: any) => i.status === "watching").length);
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = () => {
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

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const body: any = {};
      if (username !== user?.username) body.username = username;
      if (avatarUrl !== (user?.avatar || "")) body.avatar = avatarUrl;

      if (Object.keys(body).length > 0) {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          Alert.alert("Успех", "Профиль обновлён");
          loadProfile();
        } else {
          const err = await res.json();
          Alert.alert("Ошибка", err.detail || "Не удалось обновить профиль");
        }
      }
      setEditMode(false);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось обновить профиль");
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setUsername(user?.username || "");
    setAvatarUrl(user?.avatar || "");
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
        {!editMode && (
          <TouchableOpacity onPress={() => setEditMode(true)}>
            <Ionicons name="create-outline" size={22} color="#6366f1" style={styles.editIcon} />
          </TouchableOpacity>
        )}
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userAnimeCount}</Text>
          <Text style={styles.statLabel}>Всего</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Просмотрено</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{watchingCount}</Text>
          <Text style={styles.statLabel}>Смотрю</Text>
        </View>
      </View>

      {editMode && (
        <View style={styles.editPanel}>
          <Text style={styles.editTitle}>Редактирование профиля</Text>
          <TextInput
            style={styles.input}
            placeholder="Имя пользователя"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="URL аватарки"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
              <Text style={styles.saveBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#fff", alignItems: "center", paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  avatarContainer: { marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  editIcon: { marginTop: 8 },
  username: { fontSize: 24, fontWeight: "700", color: "#1e293b" },
  email: { fontSize: 14, color: "#64748b", marginTop: 4 },
  statsContainer: { flexDirection: "row", backgroundColor: "#fff", paddingVertical: 16, marginTop: 12, marginHorizontal: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 22, fontWeight: "700", color: "#6366f1" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  editPanel: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  editTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 16, textAlign: "center" },
  input: { backgroundColor: "#f1f5f9", borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, backgroundColor: "#6366f1", padding: 12, borderRadius: 8, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  cancelBtn: { flex: 1, backgroundColor: "#e2e8f0", padding: 12, borderRadius: 8, alignItems: "center" },
  cancelBtnText: { color: "#64748b", fontWeight: "600" },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 32, gap: 8 },
  logoutText: { color: "#ef4444", fontSize: 16 },
});