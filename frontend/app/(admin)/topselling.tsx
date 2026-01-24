import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface TopProduct {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
  };
  total_sold: number;
  total_revenue: number;
}

export default function AdminTopSellingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<TopProduct[]>([]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/top-selling?limit=20`);
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
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Calculate totals
  const totalSold = products.reduce((sum, p) => sum + p.total_sold, 0);
  const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الأكثر مبيعاً</Text>
        <Text style={styles.subtitle}>هذا الشهر - أفضل 20 منتج</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="cart" size={24} color={COLORS.primary} />
          <Text style={styles.summaryValue}>{totalSold}</Text>
          <Text style={styles.summaryLabel}>إجمالي المبيعات</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={24} color={COLORS.success} />
          <Text style={styles.summaryValue}>{totalRevenue.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>إجمالي الإيرادات (درهم)</Text>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={({ item, index }) => (
          <View style={styles.productCard}>
            <View style={[
              styles.rankBadge,
              index < 3 && { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }
            ]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.productCategory}>{item.product.category}</Text>
            </View>
            <View style={styles.productStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.total_sold}</Text>
                <Text style={styles.statLabel}>مبيعات</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {item.total_revenue.toFixed(0)}
                </Text>
                <Text style={styles.statLabel}>درهم</Text>
              </View>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trending-up-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد مبيعات هذا الشهر</Text>
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
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    gap: SIZES.md,
    marginBottom: SIZES.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  summaryValue: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  summaryLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SIZES.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  rankText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.fontMd,
  },
  productInfo: {
    flex: 1,
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
  productStats: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
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
