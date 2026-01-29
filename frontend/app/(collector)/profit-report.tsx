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

interface ProductProfit {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  sell_price: number;
  profit: number;
  profit_margin: number;
  stock: number;
  is_active: boolean;
}

interface DailyProfitReport {
  date: string;
  orders_count: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  products: Array<{
    product_id: string;
    product_name: string;
    cost_price: number;
    sell_price: number;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}

type TabType = 'products' | 'daily';

export default function ProfitReportScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [products, setProducts] = useState<ProductProfit[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyProfitReport | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch products with cost
      const productsRes = await fetch(`${API_URL}/api/products/all-with-cost`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }

      // Fetch daily profit report
      const today = new Date().toISOString().split('T')[0];
      const reportRes = await fetch(`${API_URL}/api/products/profit-report?date=${today}`);
      if (reportRes.ok) {
        const data = await reportRes.json();
        setDailyReport(data);
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
        <Text style={styles.title}>تقرير الأرباح</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
          onPress={() => setActiveTab('daily')}
        >
          <Ionicons 
            name="today" 
            size={20} 
            color={activeTab === 'daily' ? COLORS.white : COLORS.text} 
          />
          <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
            الربح اليومي
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons 
            name="cube" 
            size={20} 
            color={activeTab === 'products' ? COLORS.white : COLORS.text} 
          />
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            أسعار المنتجات
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'daily' && dailyReport && (
        <>
          {/* Daily Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="receipt" size={24} color={COLORS.primary} />
                <Text style={styles.summaryValue}>{dailyReport.orders_count}</Text>
                <Text style={styles.summaryLabel}>طلبية</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="cash" size={24} color={COLORS.success} />
                <Text style={styles.summaryValue}>{formatCurrency(dailyReport.total_revenue)}</Text>
                <Text style={styles.summaryLabel}>الإيرادات</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="trending-down" size={24} color={COLORS.error} />
                <Text style={styles.summaryValue}>{formatCurrency(dailyReport.total_cost)}</Text>
                <Text style={styles.summaryLabel}>التكلفة</Text>
              </View>
              <View style={[styles.summaryCard, styles.profitCard]}>
                <Ionicons name="trending-up" size={24} color={COLORS.white} />
                <Text style={[styles.summaryValue, styles.profitValue]}>{formatCurrency(dailyReport.total_profit)}</Text>
                <Text style={[styles.summaryLabel, styles.profitLabel]}>الربح الصافي</Text>
              </View>
            </View>
            <View style={styles.marginBadge}>
              <Text style={styles.marginText}>
                نسبة الربح: {dailyReport.profit_margin.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Daily Products */}
          <FlatList
            data={dailyReport.products}
            renderItem={({ item }) => (
              <View style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.product_name}</Text>
                  <Text style={styles.productQuantity}>الكمية: {item.quantity_sold}</Text>
                </View>
                <View style={styles.pricesContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>الشراء:</Text>
                    <Text style={styles.costPrice}>{formatCurrency(item.cost_price)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>البيع:</Text>
                    <Text style={styles.sellPrice}>{formatCurrency(item.sell_price)}</Text>
                  </View>
                </View>
                <View style={[styles.profitBadge, item.profit >= 0 ? styles.positiveBadge : styles.negativeBadge]}>
                  <Text style={styles.profitBadgeText}>{formatCurrency(item.profit)}</Text>
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
                <Ionicons name="analytics-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>لا توجد مبيعات اليوم</Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'products' && (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <View style={[styles.productCard, !item.is_active && styles.inactiveProduct]}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
              </View>
              <View style={styles.pricesContainer}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>الشراء:</Text>
                  <Text style={styles.costPrice}>{formatCurrency(item.cost_price)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>البيع:</Text>
                  <Text style={styles.sellPrice}>{formatCurrency(item.sell_price)}</Text>
                </View>
              </View>
              <View style={[styles.profitBadge, item.profit >= 0 ? styles.positiveBadge : styles.negativeBadge]}>
                <Text style={styles.profitBadgeText}>{formatCurrency(item.profit)}</Text>
                <Text style={styles.marginSmall}>{item.profit_margin}%</Text>
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
              <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>لا توجد منتجات</Text>
            </View>
          }
        />
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    padding: SIZES.sm,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.sm,
    borderRadius: SIZES.radiusLg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.xs,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.white,
  },
  summaryContainer: {
    padding: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
    marginHorizontal: SIZES.xs,
    ...SHADOWS.small,
  },
  profitCard: {
    backgroundColor: COLORS.success,
  },
  summaryValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  profitValue: {
    color: COLORS.white,
  },
  summaryLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  profitLabel: {
    color: COLORS.white,
    opacity: 0.9,
  },
  marginBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  marginText: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  list: {
    padding: SIZES.md,
    paddingTop: 0,
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
  inactiveProduct: {
    opacity: 0.5,
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
  productQuantity: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    textAlign: 'right',
    marginTop: 2,
  },
  pricesContainer: {
    marginHorizontal: SIZES.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  priceLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  costPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.error,
    fontWeight: '600',
  },
  sellPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.success,
    fontWeight: '600',
  },
  profitBadge: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    minWidth: 80,
  },
  positiveBadge: {
    backgroundColor: COLORS.success,
  },
  negativeBadge: {
    backgroundColor: COLORS.error,
  },
  profitBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.fontMd,
  },
  marginSmall: {
    color: COLORS.white,
    fontSize: SIZES.fontXs,
    opacity: 0.9,
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
