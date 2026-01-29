import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Statistics {
  total_customers: number;
  total_orders: number;
  today_orders: number;
  monthly_revenue: number;
  today_revenue: number;
  pending_orders: number;
  orders_by_status: Record<string, number>;
}

interface TopProduct {
  product: { id: string; name: string; price: number };
  total_sold: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, topRes] = await Promise.all([
        fetch(`${API_URL}/api/statistics`),
        fetch(`${API_URL}/api/products/top-selling?limit=5`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (topRes.ok) {
        setTopProducts(await topRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>لوحة التحكم</Text>
            <Text style={styles.userName}>{user?.name || 'المتحكم'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="receipt-outline"
            label="طلبيات اليوم"
            value={stats?.today_orders || 0}
            color={COLORS.primary}
          />
          <StatCard
            icon="time-outline"
            label="قيد الانتظار"
            value={stats?.pending_orders || 0}
            color={COLORS.warning}
          />
          <StatCard
            icon="cash-outline"
            label="إيراد اليوم"
            value={`${(stats?.today_revenue || 0).toFixed(0)} درهم`}
            color={COLORS.success}
          />
          <StatCard
            icon="trending-up-outline"
            label="إيراد الشهر"
            value={`${(stats?.monthly_revenue || 0).toFixed(0)} درهم`}
            color={COLORS.info}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="people" size={32} color={COLORS.primary} />
            <Text style={styles.summaryValue}>{stats?.total_customers || 0}</Text>
            <Text style={styles.summaryLabel}>إجمالي الزبناء</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="cart" size={32} color={COLORS.secondary} />
            <Text style={styles.summaryValue}>{stats?.total_orders || 0}</Text>
            <Text style={styles.summaryLabel}>إجمالي الطلبيات</Text>
          </View>
        </View>

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الأكثر مبيعاً هذا الشهر</Text>
              <TouchableOpacity onPress={() => router.push('/(admin)/products')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            {topProducts.map((item, index) => (
              <View key={item.product.id} style={styles.topProductItem}>
                <View style={styles.topProductRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.topProductInfo}>
                  <Text style={styles.topProductName}>{item.product.name}</Text>
                  <Text style={styles.topProductSales}>
                    {item.total_sold} مبيعات • {item.total_revenue.toFixed(2)} درهم
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="add-circle-outline"
              label="إضافة منتج"
              onPress={() => router.push('/(admin)/products')}
              color={COLORS.primary}
            />
            <ActionButton
              icon="analytics-outline"
              label="تقرير الأرباح"
              onPress={() => router.push('/(admin)/profit-report')}
              color="#9C27B0"
            />
            <ActionButton
              icon="download-outline"
              label="تصدير Excel"
              onPress={() => router.push('/(admin)/export-products')}
              color={COLORS.success}
            />
            <ActionButton
              icon="map-outline"
              label="خريطة الزبناء"
              onPress={() => router.push('/(admin)/customers')}
              color={COLORS.info}
            />
            <ActionButton
              icon="pricetags-outline"
              label="التخفيضات"
              onPress={() => router.push('/(admin)/products')}
              color={COLORS.error}
            />
            <ActionButton
              icon="settings-outline"
              label="الإعدادات"
              onPress={() => router.push('/(admin)/settings')}
              color={COLORS.textSecondary}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton = ({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SIZES.sm,
  },
  statCard: {
    width: '50%',
    padding: SIZES.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  statValue: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.fontSm,
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
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  summaryValue: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.sm,
  },
  summaryLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  section: {
    padding: SIZES.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  topProductRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  rankText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  topProductSales: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.sm,
  },
  actionButton: {
    width: '25%',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  actionLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.text,
    textAlign: 'center',
  },
});
