import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
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

interface Settings {
  store_name: string;
  whatsapp_number: string;
  banner_images: string[];
  delivery_fee: number;
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [newRes, discountRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/api/products?is_new=true`),
        fetch(`${API_URL}/api/products?is_discount=true`),
        fetch(`${API_URL}/api/settings`),
      ]);

      if (newRes.ok) {
        const data = await newRes.json();
        setNewProducts(data.slice(0, 10));
      }

      if (discountRes.ok) {
        const data = await discountRes.json();
        setDiscountProducts(data.slice(0, 10));
      }

      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
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

  const openWhatsApp = () => {
    if (settings?.whatsapp_number) {
      Linking.openURL(`https://wa.me/${settings.whatsapp_number}`);
    }
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
            <Text style={styles.greeting}>مرحباً</Text>
            <Text style={styles.userName}>{user?.name || 'زبون عزيز'}</Text>
          </View>
          <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{settings?.store_name || 'دار البقال'}</Text>
            <Text style={styles.bannerSubtitle}>تسوق سهل بأسعار تنافسية</Text>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>توصيل: {settings?.delivery_fee || 10} €</Text>
            </View>
          </View>
          <View style={styles.bannerIcon}>
            <Text style={styles.bannerEmoji}>🛒</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="grid-outline"
            label="المنتجات"
            onPress={() => router.push('/(customer)/products')}
            color={COLORS.primary}
          />
          <QuickActionButton
            icon="receipt-outline"
            label="طلبياتي"
            onPress={() => router.push('/(customer)/orders')}
            color={COLORS.secondary}
          />
          <QuickActionButton
            icon="gift-outline"
            label="هديتي"
            onPress={() => router.push('/(customer)/profile')}
            color={COLORS.accent}
            badge={(user?.total_orders || 0) >= 3 ? user?.points?.toString() : undefined}
          />
        </View>

        {/* New Products */}
        {newProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>منتجات جديدة</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/products?filter=new')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={newProducts}
              renderItem={({ item }) => (
                <View style={styles.productCardContainer}>
                  <ProductCard product={item} />
                </View>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        )}

        {/* Discount Products */}
        {discountProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.discountHeader}>
                <Ionicons name="flame" size={20} color={COLORS.error} />
                <Text style={styles.sectionTitle}>تخفيضات</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(customer)/products?filter=discount')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={discountProducts}
              renderItem={({ item }) => (
                <View style={styles.productCardContainer}>
                  <ProductCard product={item} />
                </View>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        )}

        {/* Empty State */}
        {newProducts.length === 0 && discountProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد منتجات حالياً</Text>
            <Text style={styles.emptySubtitle}>ستتوفر المنتجات قريباً</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const QuickActionButton = ({
  icon,
  label,
  onPress,
  color,
  badge,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  badge?: string;
}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      {badge && (
        <View style={[styles.quickActionBadge, { backgroundColor: color }]}>
          <Text style={styles.quickActionBadgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
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
  whatsappButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.medium,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  bannerSubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SIZES.sm,
  },
  bannerBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
  },
  bannerBadgeText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bannerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 60,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SIZES.lg,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quickActionBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.text,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
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
  productsList: {
    paddingHorizontal: SIZES.md,
  },
  productCardContainer: {
    width: 180,
    marginRight: SIZES.md,
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
