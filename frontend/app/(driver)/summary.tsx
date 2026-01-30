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

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  delivery_address?: string;
}

interface DailySummary {
  date: string;
  delivered_count: number;
  delivered_total: number;
  pending_count: number;
  pending_total: number;
  orders: Order[];
}

export default function DriverSummaryScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [showDelivered, setShowDelivered] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      // جلب طلبات اليوم
      const response = await fetch(`${API_URL}/api/orders`);
      if (response.ok) {
        const allOrders: Order[] = await response.json();
        
        // فلترة طلبات اليوم فقط
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = allOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });

        // تصنيف الطلبات
        const deliveredOrders = todayOrders.filter(o => o.status === 'delivered');
        const pendingOrders = todayOrders.filter(o => 
          o.status === 'ready' || o.status === 'delivering' || o.status === 'confirmed'
        );

        // حساب الإجماليات
        const deliveredTotal = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
        const pendingTotal = pendingOrders.reduce((sum, o) => sum + o.total, 0);

        setSummary({
          date: today.toLocaleDateString('ar-MA', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          delivered_count: deliveredOrders.length,
          delivered_total: deliveredTotal,
          pending_count: pendingOrders.length,
          pending_total: pendingTotal,
          orders: showDelivered ? deliveredOrders : pendingOrders,
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showDelivered]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.م`;
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
        <Text style={styles.title}>تقرير التوصيلات</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Date */}
      <View style={styles.dateContainer}>
        <Ionicons name="calendar" size={20} color={COLORS.primary} />
        <Text style={styles.dateText}>{summary?.date}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity 
          style={[
            styles.summaryCard, 
            styles.deliveredCard,
            showDelivered && styles.selectedCard
          ]}
          onPress={() => setShowDelivered(true)}
        >
          <Ionicons name="checkmark-circle" size={32} color={COLORS.white} />
          <Text style={styles.cardTitle}>تم التوصيل</Text>
          <Text style={styles.cardCount}>{summary?.delivered_count || 0} طلبية</Text>
          <Text style={styles.cardTotal}>{formatCurrency(summary?.delivered_total || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.summaryCard, 
            styles.pendingCard,
            !showDelivered && styles.selectedCard
          ]}
          onPress={() => setShowDelivered(false)}
        >
          <Ionicons name="time" size={32} color={COLORS.white} />
          <Text style={styles.cardTitle}>قيد التوصيل</Text>
          <Text style={styles.cardCount}>{summary?.pending_count || 0} طلبية</Text>
          <Text style={styles.cardTotal}>{formatCurrency(summary?.pending_total || 0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Total Summary */}
      <View style={styles.totalContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>إجمالي اليوم:</Text>
          <Text style={styles.totalValue}>
            {formatCurrency((summary?.delivered_total || 0) + (summary?.pending_total || 0))}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelSmall}>المحصل:</Text>
          <Text style={styles.totalValueGreen}>
            {formatCurrency(summary?.delivered_total || 0)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelSmall}>المتبقي:</Text>
          <Text style={styles.totalValueOrange}>
            {formatCurrency(summary?.pending_total || 0)}
          </Text>
        </View>
      </View>

      {/* Orders List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {showDelivered ? 'الطلبيات المُوصلة' : 'الطلبيات قيد التوصيل'}
        </Text>
        <Text style={styles.listCount}>
          ({showDelivered ? summary?.delivered_count : summary?.pending_count} طلبية)
        </Text>
      </View>

      <FlatList
        data={summary?.orders || []}
        renderItem={({ item, index }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderIndex}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderCustomer}>{item.customer_name}</Text>
              <Text style={styles.orderPhone}>{item.customer_phone}</Text>
            </View>
            <View style={styles.orderTotal}>
              <Text style={styles.orderTotalValue}>{formatCurrency(item.total)}</Text>
              <View style={[
                styles.statusBadge,
                item.status === 'delivered' ? styles.deliveredBadge : styles.pendingBadge
              ]}>
                <Text style={styles.statusText}>
                  {item.status === 'delivered' ? 'تم' : 'قيد'}
                </Text>
              </View>
            </View>
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
            <Ionicons 
              name={showDelivered ? "checkmark-done-circle-outline" : "car-outline"} 
              size={64} 
              color={COLORS.textSecondary} 
            />
            <Text style={styles.emptyTitle}>
              {showDelivered ? 'لا توجد طلبيات مُوصلة اليوم' : 'لا توجد طلبيات قيد التوصيل'}
            </Text>
          </View>
        }
      />

      {/* End of Day Summary Button */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>إجمالي المحصل اليوم</Text>
          <Text style={styles.footerValue}>{formatCurrency(summary?.delivered_total || 0)}</Text>
        </View>
      </View>
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
    backgroundColor: COLORS.primary + '15',
  },
  dateText: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SIZES.xs,
  },
  cardsContainer: {
    flexDirection: 'row',
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  deliveredCard: {
    backgroundColor: COLORS.success,
  },
  pendingCard: {
    backgroundColor: COLORS.secondary,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  cardTitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.white,
    marginTop: SIZES.xs,
    opacity: 0.9,
  },
  cardCount: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: SIZES.xs,
  },
  cardTotal: {
    fontSize: SIZES.fontMd,
    color: COLORS.white,
    fontWeight: '600',
  },
  totalContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.small,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  totalLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalLabelSmall: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  totalValueGreen: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.success,
  },
  totalValueOrange: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
  },
  listTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  listCount: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SIZES.md,
    paddingBottom: 100,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
    ...SHADOWS.small,
  },
  orderIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  indexText: {
    fontSize: SIZES.fontSm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
  },
  orderCustomer: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  orderPhone: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  orderTotalValue: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
    marginTop: 2,
  },
  deliveredBadge: {
    backgroundColor: COLORS.success,
  },
  pendingBadge: {
    backgroundColor: COLORS.secondary,
  },
  statusText: {
    fontSize: SIZES.fontXs,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: SIZES.md,
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.white,
    fontWeight: '600',
  },
  footerValue: {
    fontSize: SIZES.fontXl,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
