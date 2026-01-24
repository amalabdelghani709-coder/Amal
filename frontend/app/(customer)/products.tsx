import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import { ProductCard } from '../../src/components/ProductCard';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
  category: string;
  is_new?: boolean;
  is_discount?: boolean;
  unit?: string;
  quantity_per_unit?: string;
}

export default function ProductsScreen() {
  const params = useLocalSearchParams();
  const initialFilter = params.filter as string;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'discount'>(
    initialFilter === 'new' ? 'new' : initialFilter === 'discount' ? 'discount' : 'all'
  );

  const fetchProducts = useCallback(async () => {
    try {
      let url = `${API_URL}/api/products?`;
      
      if (activeFilter === 'new') {
        url += 'is_new=true&';
      } else if (activeFilter === 'discount') {
        url += 'is_discount=true&';
      }
      
      if (selectedCategory) {
        url += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, selectedCategory, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>المنتجات</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن منتج..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <FilterButton
          label="الكل"
          isActive={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
        />
        <FilterButton
          label="جديد"
          isActive={activeFilter === 'new'}
          onPress={() => setActiveFilter('new')}
          icon="sparkles"
        />
        <FilterButton
          label="تخفيضات"
          isActive={activeFilter === 'discount'}
          onPress={() => setActiveFilter('discount')}
          icon="flame"
        />
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <FlatList
          data={[null, ...categories]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item || 'الكل'}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item || 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesContent}
        />
      )}

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <ProductCard product={item} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد منتجات</Text>
            <Text style={styles.emptySubtitle}>جرب تغيير معايير البحث</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const FilterButton = ({
  label,
  isActive,
  onPress,
  icon,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: string;
}) => (
  <TouchableOpacity
    style={[styles.filterButton, isActive && styles.filterButtonActive]}
    onPress={onPress}
  >
    {icon && (
      <Ionicons
        name={icon as any}
        size={14}
        color={isActive ? COLORS.white : COLORS.textSecondary}
        style={{ marginRight: 4 }}
      />
    )}
    <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    gap: SIZES.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  categoriesList: {
    maxHeight: 50,
    marginBottom: SIZES.sm,
  },
  categoriesContent: {
    paddingHorizontal: SIZES.md,
  },
  categoryChip: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    marginRight: SIZES.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  categoryChipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  productsList: {
    padding: SIZES.sm,
  },
  productItem: {
    flex: 1,
    padding: SIZES.xs,
    maxWidth: '50%',
  },
  emptyState: {
    alignItems: 'center',
    padding: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptySubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
});
