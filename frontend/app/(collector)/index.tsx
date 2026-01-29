import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';
import { getStatusInfo } from '../../src/constants/orderStatus';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ product_id: string; product_name: string; quantity: number }>;
  status: string;
  created_at: string;
}

export default function CollectorScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/to-collect`);
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
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const confirmCollection = async (orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/collect`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchOrders();
        Alert.alert('تم', 'تم تأكيد تجميع الطلبية');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تأكيد التجميع');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/(auth)/login');
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً</Text>
          <Text style={styles.userName}>{user?.name || 'المجمع'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Ionicons name="cube" size={32} color={COLORS.primary} />
        <Text style={styles.statsValue}>{orders.length}</Text>
        <Text style={styles.statsLabel}>طلبية تحتاج للتجميع</Text>
      </View>

      {/* زر عرض القائمة المجمعة */}
      <TouchableOpacity 
        style={styles.allProductsButton}
        onPress={() => router.push('/(collector)/all-products')}
      >
        <View style={styles.allProductsContent}>
          <Ionicons name="list" size={28} color={COLORS.white} />
          <View style={styles.allProductsText}>
            <Text style={styles.allProductsTitle}>قائمة التجميع الكاملة</Text>
            <Text style={styles.allProductsSubtitle}>عرض جميع المنتجات مجمعة</Text>
          </View>
        </View>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* زر تعديل الطلبيات */}
      <TouchableOpacity 
        style={styles.editOrdersButton}
        onPress={() => router.push('/(collector)/edit-orders')}
      >
        <View style={styles.allProductsContent}>
          <Ionicons name="create" size={28} color={COLORS.white} />
          <View style={styles.allProductsText}>
            <Text style={styles.allProductsTitle}>تعديل الطلبيات</Text>
            <Text style={styles.allProductsSubtitle}>تعديل كميات المنتجات</Text>
          </View>
        </View>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* زر تقرير الأرباح */}
      <TouchableOpacity 
        style={styles.profitButton}
        onPress={() => router.push('/(collector)/profit-report')}
      >
        <View style={styles.allProductsContent}>
          <Ionicons name="analytics" size={28} color={COLORS.white} />
          <View style={styles.allProductsText}>
            <Text style={styles.allProductsTitle}>تقرير الأرباح</Text>
            <Text style={styles.allProductsSubtitle}>أسعار الشراء والبيع والربح</Text>
          </View>
        </View>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <FlatList
        data={orders}
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.status);
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Text style={styles.statusText}>{statusInfo.label}</Text>
                </View>
                <Text style={styles.orderId}>#{item.id.slice(-6)}</Text>
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{item.customer_name || 'زبون'}</Text>
                <Text style={styles.customerPhone}>{item.customer_phone}</Text>
              </View>

              <View style={styles.itemsList}>
                <Text style={styles.itemsTitle}>المنتجات ({item.items.length})</Text>
                {item.items.map((product, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{product.product_name}</Text>
                    <Text style={styles.itemQty}>x{product.quantity}</Text>
                  </View>
                ))}
              </View>

              <Button
                title="تأكيد التجميع"
                onPress={() => confirmCollection(item.id)}
                icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
              />
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>لا توجد طلبيات للتجميع</Text>
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
  },
  greeting: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: SIZES.sm,
  },
  statsCard: {
    backgroundColor: COLORS.primary + '20',
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  statsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  allProductsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondary,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  allProductsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allProductsText: {
    marginRight: SIZES.sm,
  },
  allProductsTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'right',
  },
  allProductsSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  editOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  list: {
    padding: SIZES.md,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  statusBadge: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
  orderId: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  customerInfo: {
    marginBottom: SIZES.sm,
  },
  customerName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  customerPhone: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  itemsList: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
  },
  itemsTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.xs,
  },
  itemName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    flex: 1,
  },
  itemQty: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.primary,
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
