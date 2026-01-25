import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { OrderCard } from '../../src/components/OrderCard';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';
import { ORDER_STATUS, getStatusInfo } from '../../src/constants/orderStatus';

const API_URL = '';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ product_name: string; quantity: number; price: number; total: number }>;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  delivery_address?: string;
}

export default function AdminOrdersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      let url = `${API_URL}/api/orders`;
      if (selectedStatus) {
        url += `?status=${selectedStatus}`;
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
  }, [selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
        setShowModal(false);
        Alert.alert('تم', 'تم تحديث حالة الطلبية');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث الحالة');
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const statusFilters = [
    { key: null, label: 'الكل' },
    { key: 'pending', label: 'قيد الانتظار' },
    { key: 'confirmed', label: 'مؤكدة' },
    { key: 'delivering', label: 'قيد التوصيل' },
    { key: 'delivered', label: 'تم التوصيل' },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة الطلبيات</Text>
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
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => openOrderDetails(item)} showCustomer />
        )}
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
          </View>
        }
      />

      {/* Order Details Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تفاصيل الطلبية</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedOrder && (
            <ScrollView style={styles.modalContent}>
              {/* Customer Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>معلومات الزبون</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>{selectedOrder.customer_name || 'غير محدد'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>{selectedOrder.customer_phone}</Text>
                  </View>
                  {selectedOrder.delivery_address && (
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>{selectedOrder.delivery_address}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>المنتجات</Text>
                <View style={styles.infoCard}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        {item.quantity}x {item.product_name}
                      </Text>
                      <Text style={styles.itemTotal}>{item.total.toFixed(2)} درهم</Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>المجموع</Text>
                    <Text style={styles.totalValue}>{selectedOrder.subtotal.toFixed(2)} درهم</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>التوصيل</Text>
                    <Text style={styles.totalValue}>{selectedOrder.delivery_fee.toFixed(2)} درهم</Text>
                  </View>
                  <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.grandTotalLabel}>الإجمالي</Text>
                    <Text style={styles.grandTotalValue}>{selectedOrder.total.toFixed(2)} درهم</Text>
                  </View>
                </View>
              </View>

              {/* Status Update */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>تغيير الحالة</Text>
                <View style={styles.statusGrid}>
                  {Object.values(ORDER_STATUS).map((status) => {
                    const isActive = selectedOrder.status === status.key;
                    return (
                      <TouchableOpacity
                        key={status.key}
                        style={[
                          styles.statusButton,
                          { borderColor: status.color },
                          isActive && { backgroundColor: status.color },
                        ]}
                        onPress={() => updateOrderStatus(selectedOrder.id, status.key)}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: isActive ? COLORS.white : status.color },
                          ]}
                        >
                          {status.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  infoText: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    flex: 1,
  },
  itemTotal: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.xs,
  },
  totalLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
  },
  grandTotalLabel: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  grandTotalValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  statusButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  statusButtonText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
});
