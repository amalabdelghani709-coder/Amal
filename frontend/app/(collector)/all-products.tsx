import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AggregatedProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  orders_count: number;
}

interface Order {
  id: string;
  items: Array<{ product_id: string; product_name: string; quantity: number }>;
}

export default function AllProductsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aggregatedProducts, setAggregatedProducts] = useState<AggregatedProduct[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchAndAggregateOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/to-collect`);
      if (response.ok) {
        const orders: Order[] = await response.json();
        setTotalOrders(orders.length);
        
        // تجميع المنتجات من جميع الطلبيات
        const productMap = new Map<string, AggregatedProduct>();
        
        orders.forEach(order => {
          order.items.forEach(item => {
            const existing = productMap.get(item.product_id);
            if (existing) {
              existing.total_quantity += item.quantity;
              existing.orders_count += 1;
            } else {
              productMap.set(item.product_id, {
                product_id: item.product_id,
                product_name: item.product_name,
                total_quantity: item.quantity,
                orders_count: 1,
              });
            }
          });
        });
        
        // تحويل إلى مصفوفة وترتيب حسب الكمية
        const products = Array.from(productMap.values());
        products.sort((a, b) => b.total_quantity - a.total_quantity);
        setAggregatedProducts(products);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAndAggregateOrders();
  }, [fetchAndAggregateOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAndAggregateOrders();
  };

  const getTotalItems = () => {
    return aggregatedProducts.reduce((sum, p) => sum + p.total_quantity, 0);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>قائمة التجميع الكاملة</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ملخص */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="receipt" size={28} color={COLORS.primary} />
          <Text style={styles.summaryValue}>{totalOrders}</Text>
          <Text style={styles.summaryLabel}>طلبية</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cube" size={28} color={COLORS.secondary} />
          <Text style={styles.summaryValue}>{aggregatedProducts.length}</Text>
          <Text style={styles.summaryLabel}>منتج مختلف</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="layers" size={28} color={COLORS.accent} />
          <Text style={styles.summaryValue}>{getTotalItems()}</Text>
          <Text style={styles.summaryLabel}>إجمالي القطع</Text>
        </View>
      </View>

      {/* قائمة المنتجات */}
      <FlatList
        data={aggregatedProducts}
        renderItem={({ item, index }) => (
          <View style={styles.productCard}>
            <View style={styles.productIndex}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.ordersCount}>
                في {item.orders_count} طلبية
              </Text>
            </View>
            <View style={styles.quantityBox}>
              <Text style={styles.quantityValue}>{item.total_quantity}</Text>
              <Text style={styles.quantityLabel}>قطعة</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.product_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>لا توجد منتجات للتجميع</Text>
            <Text style={styles.emptySubtitle}>جميع الطلبيات تم تجميعها</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SIZES.sm,
  },
  title: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    marginVertical: SIZES.sm,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.small,
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: SIZES.fontXl,
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
  productIndex: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  indexText: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  ordersCount: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  quantityBox: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    minWidth: 70,
  },
  quantityValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  quantityLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.white,
    opacity: 0.8,
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
