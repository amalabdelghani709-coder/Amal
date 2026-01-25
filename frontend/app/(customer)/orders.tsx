import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { OrderCard } from '../../src/components/OrderCard';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = '';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ product_name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  created_at: string;
  delivery_address?: string;
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      let url = `${API_URL}/api/orders?customer_id=${user.id}`;
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const statusFilters = [
    { key: null, label: 'الكل' },
    { key: 'pending', label: 'قيد الانتظار' },
    { key: 'delivering', label: 'قيد التوصيل' },
    { key: 'delivered', label: 'تم التوصيل' },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>طلبياتي</Text>
      </View>

      {/* Status Filters */}
      <FlatList
        data={statusFilters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === item.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(item.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === item.key && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key || 'all'}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersList}
        contentContainerStyle={styles.filtersContent}
      />

      <FlatList
        data={orders}
        renderItem={({ item }) => <OrderCard order={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد طلبيات</Text>
            <Text style={styles.emptySubtitle}>طلبياتك ستظهر هنا</Text>
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
  filtersList: {
    maxHeight: 50,
    marginBottom: SIZES.sm,
  },
  filtersContent: {
    paddingHorizontal: SIZES.md,
  },
  filterChip: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    marginRight: SIZES.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    padding: SIZES.md,
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
