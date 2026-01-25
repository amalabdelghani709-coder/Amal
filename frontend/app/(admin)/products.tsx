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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = '';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  image?: string;
  unit?: string;
  quantity_per_unit?: string;
  stock: number;
  is_new: boolean;
  is_discount: boolean;
  is_active: boolean;
  sales_count: number;
}

export default function AdminProductsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [quantityPerUnit, setQuantityPerUnit] = useState('');
  const [stock, setStock] = useState('100');
  const [isNew, setIsNew] = useState(false);
  const [isDiscount, setIsDiscount] = useState(false);
  const [image, setImage] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?active_only=false`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setOriginalPrice('');
    setCategory('');
    setUnit('');
    setQuantityPerUnit('');
    setStock('100');
    setIsNew(false);
    setIsDiscount(false);
    setImage('');
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setOriginalPrice(product.original_price?.toString() || '');
    setCategory(product.category);
    setUnit(product.unit || '');
    setQuantityPerUnit(product.quantity_per_unit || '');
    setStock(product.stock.toString());
    setIsNew(product.is_new);
    setIsDiscount(product.is_discount);
    setImage(product.image || '');
    setShowModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !category) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        category,
        unit,
        quantity_per_unit: quantityPerUnit,
        stock: parseInt(stock),
        is_new: isNew,
        is_discount: isDiscount,
        image,
      };

      let response;
      if (editingProduct) {
        response = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      } else {
        response = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchProducts();
        Alert.alert('تم', editingProduct ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
      } else {
        Alert.alert('خطأ', 'فشل حفظ المنتج');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'حذف المنتج',
      `هل تريد حذف "${product.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/products/${product.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchProducts();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل حذف المنتج');
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, !item.is_active && styles.inactiveCard]}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.productImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color={COLORS.textLight} />
          </View>
        )}
        {item.is_new && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>جديد</Text>
          </View>
        )}
        {item.is_discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.badgeText}>تخفيض</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>{item.price.toFixed(2)} درهم</Text>
          <Text style={styles.productStock}>المخزون: {item.stock}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة المنتجات</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد منتجات</Text>
            <Button title="إضافة منتج" onPress={openAddModal} style={{ marginTop: SIZES.md }} />
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.pickedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={styles.imagePickerText}>اختر صورة</Text>
                </View>
              )}
            </TouchableOpacity>

            <Input
              label="اسم المنتج *"
              value={name}
              onChangeText={setName}
              placeholder="أدخل اسم المنتج"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="السعر *"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="السعر الأصلي"
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="الفئة *"
              value={category}
              onChangeText={setCategory}
              placeholder="مثل: مواد غذائية"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="الوحدة"
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="كغ"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="الكمية/الوحدة"
                  value={quantityPerUnit}
                  onChangeText={setQuantityPerUnit}
                  placeholder="1كغ"
                />
              </View>
            </View>

            <Input
              label="المخزون"
              value={stock}
              onChangeText={setStock}
              placeholder="100"
              keyboardType="numeric"
            />

            {/* Toggles */}
            <View style={styles.togglesContainer}>
              <TouchableOpacity
                style={[styles.toggle, isNew && styles.toggleActive]}
                onPress={() => setIsNew(!isNew)}
              >
                <Ionicons
                  name={isNew ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isNew ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.toggleText, isNew && styles.toggleTextActive]}>
                  منتج جديد
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggle, isDiscount && styles.toggleActive]}
                onPress={() => setIsDiscount(!isDiscount)}
              >
                <Ionicons
                  name={isDiscount ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isDiscount ? COLORS.error : COLORS.textSecondary}
                />
                <Text style={[styles.toggleText, isDiscount && { color: COLORS.error }]}>
                  تخفيض
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
              onPress={handleSave}
              loading={isSaving}
              size="large"
              style={{ marginTop: SIZES.md, marginBottom: SIZES.xxl }}
            />
          </ScrollView>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SIZES.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  inactiveCard: {
    opacity: 0.5,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
    justifyContent: 'center',
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
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.xs,
  },
  productPrice: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productStock: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    justifyContent: 'center',
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
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: SIZES.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  imagePickerText: {
    marginTop: SIZES.sm,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  halfInput: {
    flex: 1,
  },
  togglesContainer: {
    flexDirection: 'row',
    gap: SIZES.lg,
    marginTop: SIZES.md,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  toggleActive: {},
  toggleText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
