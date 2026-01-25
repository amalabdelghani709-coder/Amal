import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = '';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  image?: string;
  is_discount: boolean;
}

export default function AdminDiscountsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [regularProducts, setRegularProducts] = useState<Product[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?active_only=true`);
      if (response.ok) {
        const data = await response.json();
        setDiscountProducts(data.filter((p: Product) => p.is_discount));
        setRegularProducts(data.filter((p: Product) => !p.is_discount));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const toggleDiscount = async (product: Product) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_discount: !product.is_discount }),
      });

      if (response.ok) {
        fetchProducts();
        Alert.alert('تم', product.is_discount ? 'تم إزالة التخفيض' : 'تم إضافة التخفيض');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث المنتج');
    }
  };

  const displayProducts = showAll ? regularProducts : discountProducts;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة التخفيضات</Text>
        <Text style={styles.subtitle}>{discountProducts.length} منتج في التخفيضات</Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showAll && styles.toggleButtonActive]}
          onPress={() => setShowAll(false)}
        >
          <Ionicons name="flame" size={18} color={!showAll ? COLORS.white : COLORS.error} />
          <Text style={[styles.toggleText, !showAll && styles.toggleTextActive]}>
            التخفيضات ({discountProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showAll && styles.toggleButtonActive]}
          onPress={() => setShowAll(true)}
        >
          <Ionicons name="cube" size={18} color={showAll ? COLORS.white : COLORS.primary} />
          <Text style={[styles.toggleText, showAll && styles.toggleTextActive]}>
            باقي المنتجات ({regularProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayProducts}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productImageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={24} color={COLORS.textLight} />
                </View>
              )}
              {item.is_discount && (
                <View style={styles.discountBadge}>
                  <Ionicons name="flame" size={12} color={COLORS.white} />
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{item.price.toFixed(2)} درهم</Text>
                {item.original_price && (
                  <Text style={styles.originalPrice}>{item.original_price.toFixed(2)}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: item.is_discount ? COLORS.error + '20' : COLORS.success + '20' }
              ]}
              onPress={() => toggleDiscount(item)}
            >
              <Ionicons
                name={item.is_discount ? 'remove-circle' : 'add-circle'}
                size={24}
                color={item.is_discount ? COLORS.error : COLORS.success}
              />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={showAll ? 'cube-outline' : 'flame-outline'} size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>
              {showAll ? 'لا توجد منتجات' : 'لا توجد تخفيضات'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

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
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    padding: SIZES.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
  },
  productName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  productCategory: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginTop: SIZES.xs,
  },
  productPrice: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
});
