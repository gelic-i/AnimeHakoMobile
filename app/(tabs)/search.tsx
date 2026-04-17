import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL, STATIC_BASE_URL, STORAGE_KEYS } from "../../config";
import { Anime } from "../../types";
// Добавь в начало файла, после импортов:
const formatRating = (rating: any): string => {
  if (rating === null || rating === undefined) return "?";
  const num = typeof rating === "string" ? parseFloat(rating) : rating;
  if (isNaN(num)) return "?";
  return num.toFixed(1);
};
export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "year" | "created">("rating");
  const [genresList, setGenresList] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialGenre, setInitialGenre] = useState<string | null>(null);
  const router = useRouter();
  const localParams = useLocalSearchParams();

  const years = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

  const loadGenres = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/genres`, { headers });
      const data = await response.json();
      setGenresList(data.map((g: any) => g.name));
    } catch (error) {
      console.error("Ошибка загрузки жанров:", error);
    }
  };

  const loadCatalog = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = `${API_BASE_URL}/anime?page=${pageNum}&limit=20&sort=${sortBy}`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (pageNum === 1) {
        setResults(data.data || []);
      } else {
        setResults((prev) => [...prev, ...(data.data || [])]);
      }
      setHasMore(data.data?.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Ошибка загрузки каталога:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGenres();
    loadCatalog(1);
  }, []);

  useEffect(() => {
    if (
      !initialGenre &&
      !searchQuery.trim() &&
      selectedGenres.length === 0 &&
      !selectedYear
    ) {
      loadCatalog(1);
    }
  }, [sortBy]);

  useEffect(() => {
    const genreParam = localParams.genre as string | undefined;
    if (genreParam && !initialGenre) {
      setInitialGenre(genreParam);
      setSelectedGenres([genreParam]);
      handleSearchWithGenre(genreParam);
    } else if (!genreParam && initialGenre) {
      setInitialGenre(null);
      setSelectedGenres([]);
      loadCatalog(1);
    }
  }, [localParams]);

  const handleSearchWithGenre = async (genre: string, pageNum: number = 1) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = `${API_BASE_URL}/anime?page=${pageNum}&genres=${encodeURIComponent(genre)}&sort=${sortBy}`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (pageNum === 1) {
        setResults(data.data || []);
      } else {
        setResults((prev) => [...prev, ...(data.data || [])]);
      }
      setHasMore(data.data?.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Ошибка поиска:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      if (initialGenre) {
        handleSearchWithGenre(initialGenre, nextPage);
      } else if (
        searchQuery.trim() ||
        selectedGenres.length > 0 ||
        selectedYear
      ) {
        handleSearchMore(nextPage);
      } else {
        loadCatalog(nextPage);
      }
    }
  };

  const handleSearchMore = async (pageNum: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/anime?page=${pageNum}&sort=${sortBy}`;
      if (searchQuery.trim())
        url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedGenres.length) url += `&genres=${selectedGenres.join(",")}`;
      if (selectedYear) url += `&year=${selectedYear}`;

      const response = await fetch(url, { headers });
      const data = await response.json();
      setResults((prev) => [...prev, ...(data.data || [])]);
      setHasMore(data.data?.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Ошибка поиска:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedGenres.length === 0 && !selectedYear) {
      loadCatalog(1);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/anime?page=1&sort=${sortBy}`;
      if (searchQuery.trim())
        url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedGenres.length) url += `&genres=${selectedGenres.join(",")}`;
      if (selectedYear) url += `&year=${selectedYear}`;

      const response = await fetch(url, { headers });
      const data = await response.json();
      setResults(data.data || []);
      setHasMore(data.data?.length === 20);
      setPage(1);
    } catch (error) {
      console.error("Ошибка поиска:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    handleSearch();
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedYear("");
    setSearchQuery("");
    setResults([]);
  };

  // Функция для перехода на страницу аниме
  const goToAnime = (id: number) => {
    router.push(`/anime/${id}` as Href);
  };

  const renderAnimeCard = ({ item }: { item: Anime }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => goToAnime(item.id)}
    >
      <Image
        source={{
          uri:
            item.poster?.startsWith("http://") ||
            item.poster?.startsWith("https://")
              ? item.poster
              : `${STATIC_BASE_URL}${item.poster || ""}`,
        }}
        style={styles.poster}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardTitleEn}>{item.titleEn}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.rating}>⭐ {formatRating(item.rating)}</Text>
          <Text style={styles.year}>{item.year}</Text>
        </View>
        <View style={styles.genresContainer}>
          {item.genres?.slice(0, 3).map((genre, idx) => (
            <View key={idx} style={styles.genreBadge}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск аниме..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Сортировка:</Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "rating" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("rating")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "rating" && styles.sortButtonTextActive,
            ]}
          >
            По рейтингу
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "year" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("year")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "year" && styles.sortButtonTextActive,
            ]}
          >
            По году
          </Text>
        </TouchableOpacity>
      </View>

      {(selectedGenres.length > 0 || selectedYear) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFilters}
        >
          {selectedGenres.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={styles.filterChip}
              onPress={() => toggleGenre(genre)}
            >
              <Text style={styles.filterChipText}>{genre} ✕</Text>
            </TouchableOpacity>
          ))}
          {selectedYear && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setSelectedYear("")}
            >
              <Text style={styles.filterChipText}>{selectedYear} ✕</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderAnimeCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && hasMore ? (
              <ActivityIndicator style={styles.loader} color="#6366f1" />
            ) : null
          }
        />
      ) : searchQuery || selectedGenres.length > 0 || selectedYear ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Ничего не найдено</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Введите название для поиска</Text>
        </View>
      )}

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Фильтры</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.filterSectionTitle}>Жанры</Text>
              <View style={styles.genresGrid}>
                {genresList.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreOption,
                      selectedGenres.includes(genre) &&
                        styles.genreOptionSelected,
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text
                      style={[
                        styles.genreOptionText,
                        selectedGenres.includes(genre) &&
                          styles.genreOptionTextSelected,
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Год</Text>
              <View style={styles.yearsRow}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      selectedYear === year && styles.yearOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedYear(selectedYear === year ? "" : year)
                    }
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        selectedYear === year && styles.yearOptionTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Сбросить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 16,
    color: "#1e293b",
  },
  activeFilters: {
    paddingHorizontal: 16,
    marginBottom: 12,
    maxHeight: 40,
  },
  filterChip: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    color: "#6366f1",
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  poster: {
    width: 80,
    height: 120,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardTitleEn: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 12,
  },
  rating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f59e0b",
  },
  year: {
    fontSize: 13,
    color: "#64748b",
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  genreBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 11,
    color: "#475569",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  genresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  genreOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  genreOptionSelected: {
    backgroundColor: "#6366f1",
  },
  genreOptionText: {
    color: "#475569",
  },
  genreOptionTextSelected: {
    color: "#fff",
  },
  yearsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  yearOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  yearOptionSelected: {
    backgroundColor: "#6366f1",
  },
  yearOptionText: {
    color: "#475569",
  },
  yearOptionTextSelected: {
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#64748b",
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sortLabel: {
    color: "#64748b",
    fontSize: 14,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  sortButtonActive: {
    backgroundColor: "#6366f1",
  },
  sortButtonText: {
    color: "#64748b",
    fontSize: 13,
  },
  sortButtonTextActive: {
    color: "#fff",
  },
  loader: {
    paddingVertical: 20,
  },
});
