import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { STORAGE_KEYS } from "../config";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      setIsAuthenticated(!!token);
      return !!token;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Первоначальная проверка
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Перепроверяем авторизацию при изменении сегментов (после навигации)
  useEffect(() => {
    const verifyAuth = async () => {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      setIsAuthenticated(!!token);
    };
    verifyAuth();
  }, [segments]);

  useEffect(() => {
    if (isChecking) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isChecking]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen
        name="anime/[id]"
        options={{ headerShown: true, title: "Детали аниме" }}
      />
    </Stack>
  );
}
