import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useCartStore, CartItem } from '../../src/store/cartStore';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';

const API_URL = '';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  const total = getTotal();
  const deliveryFee = 10; // Will be fetched from settings
  const canUsePoints = (user?.total_orders || 0) >= 3 && (user?.points || 0) > 0;
  const pointsDiscount = usePoints ? Math.min((user?.points || 0) / 100, deliveryFee) : 0;
  const finalTotal = total + deliveryFee - pointsDiscount;

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('تنبيه', 'الرجاء تسجيل الدخول أولاً');
      return;
    }

    if (items.length === 0) {
      Alert.alert('تنبيه', 'السلة فارغة');
      return;
    }

    setIsLoading(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));

      const response = await fetch(`${API_URL}/api/orders?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          delivery_address: user.address || '',
          delivery_latitude: user.latitude,
          delivery_longitude: user.longitude,
          notes: '',
          use_points: usePoints,
        }),
      });

      if (response.ok) {
        clearCart();
        Alert.alert(
          'تم بنجاح',
          'تم إرسال طلبيتك بنجاح!',
          [{ text: 'حسناً', onPress: () => router.push('/(customer)/orders') }]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل إرسال الطلبية');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }}
            style={styles.itemImage}
          />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color={COLORS.textLight} />
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.itemPrice}>{item.price.toFixed(2)} درهم</Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={18} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.quantity}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
        >
          <Ionicons name="add" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'حذف المنتج',
            'هل تريد حذف هذا المنتج من السلة؟',
            [
              { text: 'إلغاء', style: 'cancel' },
              { text: 'حذف', style: 'destructive', onPress: () => removeItem(item.product_id) },
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سلة التسوق</Text>
        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'تفريغ السلة',
                'هل تريد حذف جميع المنتجات؟',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'تفريغ', style: 'destructive', onPress: clearCart },
                ]
              );
            }}
          >
            <Text style={styles.clearButton}>تفريغ السلة</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={80} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>سلتك فارغة</Text>
          <Text style={styles.emptySubtitle}>ابدأ التسوق وأضف منتجات</Text>
          <Button
            title="تصفح المنتجات"
            onPress={() => router.push('/(customer)/products')}
            style={{ marginTop: SIZES.lg }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product_id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            {/* Points Option */}
            {canUsePoints && (
              <TouchableOpacity
                style={styles.pointsOption}
                onPress={() => setUsePoints(!usePoints)}
              >
                <View style={styles.pointsInfo}>
                  <Ionicons
                    name={usePoints ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={COLORS.primary}
                  />
                  <View style={styles.pointsText}>
                    <Text style={styles.pointsLabel}>استخدام هديتي</Text>
                    <Text style={styles.pointsValue}>لديك {user?.points} نقطة</Text>
                  </View>
                </View>
                {usePoints && (
                  <Text style={styles.pointsDiscount}>-{pointsDiscount.toFixed(2)} درهم</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
                <Text style={styles.summaryValue}>{total.toFixed(2)} درهم</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>رسوم التوصيل</Text>
                <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)} درهم</Text>
              </View>
              {usePoints && pointsDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>خصم النقاط</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>-{pointsDiscount.toFixed(2)} درهم</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>الإجمالي</Text>
                <Text style={styles.totalValue}>{finalTotal.toFixed(2)} درهم</Text>
              </View>
            </View>

            <Button
              title="تأكيد الطلبية"
              onPress={handleCheckout}
              loading={isLoading}
              size="large"
            />
          </View>
        </>
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
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearButton: {
    fontSize: SIZES.fontMd,
    color: COLORS.error,
  },
  list: {
    padding: SIZES.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
  },
  itemName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xs,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 30,
    textAlign: 'center',
  },
  deleteButton: {
    padding: SIZES.sm,
    marginLeft: SIZES.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptySubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pointsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    marginLeft: SIZES.sm,
  },
  pointsLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  pointsValue: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  pointsDiscount: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.success,
  },
  summary: {
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xs,
  },
  summaryLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.sm,
    marginTop: SIZES.xs,
  },
  totalLabel: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
