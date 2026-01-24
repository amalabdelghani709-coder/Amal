import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Customer {
  id: string;
  phone: string;
  name: string;
  address?: string;
  city?: string;
  total_orders: number;
  points: number;
  created_at: string;
}

export default function AdminCustomersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'orders'>('orders');

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users?role=customer&sort_by=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const openWhatsApp = (phone: string) => {
    Linking.openURL(`https://wa.me/${phone}`);
  };

  const renderCustomer = ({ item, index }: { item: Customer; index: number }) => (
    <View style={styles.customerCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name || 'زبون'}</Text>
        <Text style={styles.customerPhone}>{item.phone}</Text>
        {item.city && <Text style={styles.customerCity}>{item.city}</Text>}
      </View>
      
      <View style={styles.customerStats}>
        <View style={styles.statBadge}>
          <Ionicons name="cart" size={14} color={COLORS.primary} />
          <Text style={styles.statText}>{item.total_orders}</Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: COLORS.accent + '20' }]}>
          <Ionicons name="star" size={14} color={COLORS.accent} />
          <Text style={[styles.statText, { color: COLORS.accent }]}>{item.points}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.whatsappButton} onPress={() => openWhatsApp(item.phone)}>
        <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الزبناء</Text>
        <Text style={styles.subtitle}>{customers.length} زبون</Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'orders' && styles.sortButtonActive]}
          onPress={() => setSortBy('orders')}
        >
          <Text style={[styles.sortText, sortBy === 'orders' && styles.sortTextActive]}>
            بعدد الطلبيات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'created_at' && styles.sortButtonActive]}
          onPress={() => setSortBy('created_at')}
        >
          <Text style={[styles.sortText, sortBy === 'created_at' && styles.sortTextActive]}>
            بتاريخ التسجيل
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا يوجد زبناء</Text>
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
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    gap: SIZES.sm,
  },
  sortButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  sortTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    padding: SIZES.md,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  rankBadge: {
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
    fontSize: SIZES.fontSm,
  },
  customerInfo: {
    flex: 1,
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
  customerCity: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  customerStats: {
    flexDirection: 'row',
    gap: SIZES.xs,
    marginRight: SIZES.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusFull,
    gap: 4,
  },
  statText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  whatsappButton: {
    padding: SIZES.sm,
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
