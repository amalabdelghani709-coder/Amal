import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  status: string;
  total: number;
  created_at: string;
}

export default function EditOrdersScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [newQuantity, setNewQuantity] = useState('');

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

  const openEditModal = (order: Order, item: OrderItem) => {
    setSelectedOrder(order);
    setEditingItem(item);
    setNewQuantity(item.quantity.toString());
    setEditModalVisible(true);
  };

  const updateItemQuantity = async () => {
    if (!selectedOrder || !editingItem) return;

    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('خطأ', 'الرجاء إدخال كمية صحيحة');
      return;
    }

    try {
      // تحديث الكمية أو حذف المنتج إذا كانت الكمية 0
      const updatedItems = qty === 0
        ? selectedOrder.items.filter(i => i.product_id !== editingItem.product_id)
        : selectedOrder.items.map(i => 
            i.product_id === editingItem.product_id 
              ? { ...i, quantity: qty }
              : i
          );

      // حساب الإجمالي الجديد
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          total: newTotal,
        }),
      });

      if (response.ok) {
        Alert.alert('تم', qty === 0 ? 'تم حذف المنتج من الطلبية' : 'تم تحديث الكمية بنجاح');
        setEditModalVisible(false);
        fetchOrders();
      } else {
        Alert.alert('خطأ', 'فشل تحديث الطلبية');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    }
  };

  const deleteItem = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف "${editingItem?.product_name}" من الطلبية؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            setNewQuantity('0');
            updateItemQuantity();
          }
        },
      ]
    );
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
        <Text style={styles.title}>تعديل الطلبيات</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={orders}
        renderItem={({ item: order }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>طلبية #{order.id.slice(-6)}</Text>
              <Text style={styles.customerName}>{order.customer_name}</Text>
            </View>

            <View style={styles.itemsList}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => openEditModal(order, item)}
                  >
                    <Ionicons name="pencil" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemPrice}>{item.price} درهم</Text>
                  </View>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalLabel}>الإجمالي:</Text>
              <Text style={styles.totalValue}>{order.total} درهم</Text>
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
            <Ionicons name="create-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>لا توجد طلبيات للتعديل</Text>
          </View>
        }
      />

      {/* Modal تعديل الكمية */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تعديل الكمية</Text>
            <Text style={styles.modalProductName}>{editingItem?.product_name}</Text>
            
            <View style={styles.quantityInputContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setNewQuantity(Math.max(0, parseInt(newQuantity || '0') - 1).toString())}
              >
                <Ionicons name="remove" size={24} color={COLORS.white} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={newQuantity}
                onChangeText={setNewQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setNewQuantity((parseInt(newQuantity || '0') + 1).toString())}
              >
                <Ionicons name="add" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={deleteItem}
              >
                <Ionicons name="trash" size={18} color={COLORS.white} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateItemQuantity}
              >
                <Text style={styles.saveButtonText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  customerName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemsList: {
    marginBottom: SIZES.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  editButton: {
    padding: SIZES.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: SIZES.radiusSm,
    marginLeft: SIZES.sm,
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
  },
  itemName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  quantityBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  modalProductName: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 80,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    marginHorizontal: SIZES.md,
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    marginHorizontal: SIZES.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    flex: 0.5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
