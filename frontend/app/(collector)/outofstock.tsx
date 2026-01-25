import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = '';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
}

interface AffectedOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
}

export default function OutOfStockScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [affectedOrders, setAffectedOrders] = useState<AffectedOrder[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?active_only=true`);
      if (response.ok) {
        const data = await response.json();
        // Filter products with low stock
        setProducts(data.filter((p: Product) => p.stock <= 10));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const markOutOfStock = async (product: Product) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${product.id}/out-of-stock`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(product);
        setAffectedOrders(data.affected_orders || []);
        setShowModal(true);
        fetchProducts();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث المنتج');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>نفاد المخزون</Text>
        <Text style={styles.subtitle}>المنتجات ذات المخزون المنخفض</Text>
      </View>

      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <View style={styles.stockRow}>
                <Ionicons
                  name={item.stock === 0 ? 'alert-circle' : 'warning'}
                  size={16}
                  color={item.stock === 0 ? COLORS.error : COLORS.warning}
                />
                <Text style={[styles.stockText, { color: item.stock === 0 ? COLORS.error : COLORS.warning }]}>
                  المخزون: {item.stock}
                </Text>
              </View>
            </View>
            {item.stock > 0 && (
              <TouchableOpacity
                style={styles.markButton}
                onPress={() => markOutOfStock(item)}
              >
                <Text style={styles.markButtonText}>نفد</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>جميع المنتجات متوفرة</Text>
            <Text style={styles.emptySubtitle}>لا توجد منتجات ذات مخزون منخفض</Text>
          </View>
        }
      />

      {/* Affected Orders Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>الطلبيات المتأثرة</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            {selectedProduct && (
              <View style={styles.productHeader}>
                <Ionicons name="alert-circle" size={24} color={COLORS.error} />
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
              </View>
            )}

            {affectedOrders.length > 0 ? (
              <>
                <Text style={styles.affectedTitle}>
                  {affectedOrders.length} طلبية متأثرة
                </Text>
                <FlatList
                  data={affectedOrders}
                  renderItem={({ item }) => (
                    <View style={styles.affectedCard}>
                      <Text style={styles.affectedName}>{item.customer_name || 'زبون'}</Text>
                      <Text style={styles.affectedPhone}>{item.customer_phone}</Text>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                />
              </>
            ) : (
              <View style={styles.noAffected}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
                <Text style={styles.noAffectedText}>لا توجد طلبيات متأثرة</Text>
              </View>
            )}

            <Button
              title="إغلاق"
              onPress={() => setShowModal(false)}
              style={{ marginTop: SIZES.lg }}
            />
          </View>
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
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SIZES.md,
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
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginTop: SIZES.xs,
  },
  stockText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
  markButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  markButtonText: {
    color: COLORS.white,
    fontWeight: '600',
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
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.error + '20',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
  },
  modalProductName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.text,
  },
  affectedTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  affectedCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.sm,
  },
  affectedName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  affectedPhone: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  noAffected: {
    alignItems: 'center',
    padding: SIZES.xl,
  },
  noAffectedText: {
    fontSize: SIZES.fontMd,
    color: COLORS.success,
    marginTop: SIZES.sm,
  },
});
