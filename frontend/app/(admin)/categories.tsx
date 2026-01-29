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
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Category {
  name: string;
  count: number;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  'عام': 'cube',
  'فواكه': 'nutrition',
  'خضار': 'leaf',
  'لحوم': 'restaurant',
  'ألبان': 'water',
  'مشروبات': 'beer',
  'حلويات': 'ice-cream',
  'منظفات': 'sparkles',
  'مواد غذائية': 'fast-food',
  'توابل': 'flame',
  'زيوت': 'water',
  'معلبات': 'file-tray-stacked',
  'default': 'pricetag',
};

export default function CategoriesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?active_only=false`);
      if (response.ok) {
        const products: Product[] = await response.json();
        
        // تجميع المنتجات حسب الفئة
        const categoryMap = new Map<string, Product[]>();
        
        products.forEach(product => {
          const cat = product.category || 'عام';
          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, []);
          }
          categoryMap.get(cat)!.push(product);
        });

        // تحويل إلى مصفوفة
        const categoriesArray: Category[] = Array.from(categoryMap.entries())
          .map(([name, prods]) => ({
            name,
            count: prods.length,
            products: prods,
          }))
          .sort((a, b) => b.count - a.count);

        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const openCategoryProducts = (category: Category) => {
    setSelectedCategory(category);
    setShowProductsModal(true);
  };

  const renameCategory = async () => {
    if (!editingCategory || !newName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم الفئة');
      return;
    }

    try {
      // تحديث جميع المنتجات في هذه الفئة
      const category = categories.find(c => c.name === editingCategory);
      if (!category) return;

      let successCount = 0;
      for (const product of category.products) {
        const response = await fetch(`${API_URL}/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: newName.trim() }),
        });
        if (response.ok) successCount++;
      }

      Alert.alert('تم', `تم تغيير اسم الفئة لـ ${successCount} منتج`);
      setEditingCategory(null);
      setNewName('');
      fetchCategories();
    } catch (error) {
      Alert.alert('خطأ', 'فشل تغيير اسم الفئة');
    }
  };

  const moveProductToCategory = async (product: Product, newCategory: string) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      
      if (response.ok) {
        Alert.alert('تم', `تم نقل "${product.name}" إلى "${newCategory}"`);
        fetchCategories();
        setShowProductsModal(false);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل نقل المنتج');
    }
  };

  const showMoveOptions = (product: Product) => {
    const otherCategories = categories
      .filter(c => c.name !== selectedCategory?.name)
      .map(c => c.name);

    if (Platform.OS === 'web') {
      const newCat = window.prompt(
        `نقل "${product.name}" إلى فئة أخرى\n\nالفئات المتاحة:\n${otherCategories.join('\n')}\n\nأدخل اسم الفئة:`,
        otherCategories[0]
      );
      if (newCat) {
        moveProductToCategory(product, newCat);
      }
    } else {
      Alert.alert(
        'نقل المنتج',
        `اختر الفئة الجديدة لـ "${product.name}"`,
        [
          ...otherCategories.slice(0, 5).map(cat => ({
            text: cat,
            onPress: () => moveProductToCategory(product, cat),
          })),
          { text: 'إلغاء', style: 'cancel' as const },
        ]
      );
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    return CATEGORY_ICONS[categoryName] || CATEGORY_ICONS['default'];
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
        <Text style={styles.title}>تصنيف المنتجات</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{categories.length}</Text>
          <Text style={styles.summaryLabel}>فئة</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {categories.reduce((sum, c) => sum + c.count, 0)}
          </Text>
          <Text style={styles.summaryLabel}>منتج</Text>
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => openCategoryProducts(item)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `hsl(${index * 40}, 70%, 50%)` }]}>
              <Ionicons 
                name={getCategoryIcon(item.name) as any} 
                size={24} 
                color={COLORS.white} 
              />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{item.count} منتج</Text>
            </View>
            <View style={styles.categoryActions}>
              <TouchableOpacity 
                style={styles.editCategoryButton}
                onPress={() => {
                  setEditingCategory(item.name);
                  setNewName(item.name);
                  setShowModal(true);
                }}
              >
                <Ionicons name="pencil" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      />

      {/* Rename Category Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تغيير اسم الفئة</Text>
            <Text style={styles.modalSubtitle}>الفئة الحالية: {editingCategory}</Text>
            
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="الاسم الجديد"
              placeholderTextColor={COLORS.textSecondary}
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setEditingCategory(null);
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={renameCategory}
              >
                <Text style={styles.saveButtonText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Products Modal */}
      <Modal
        visible={showProductsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductsModal(false)}
      >
        <View style={styles.productsModalOverlay}>
          <View style={styles.productsModalContent}>
            <View style={styles.productsModalHeader}>
              <TouchableOpacity onPress={() => setShowProductsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.productsModalTitle}>
                {selectedCategory?.name} ({selectedCategory?.count})
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <FlatList
              data={selectedCategory?.products || []}
              renderItem={({ item }) => (
                <View style={styles.productItem}>
                  <View style={styles.productItemInfo}>
                    <Text style={styles.productItemName}>{item.name}</Text>
                    <Text style={styles.productItemPrice}>{item.price} درهم</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.moveButton}
                    onPress={() => showMoveOptions(item)}
                  >
                    <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsList}
            />
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.small,
  },
  summaryItem: {
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },
  summaryValue: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  list: {
    padding: SIZES.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  categoryInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
  },
  categoryName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  categoryCount: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editCategoryButton: {
    padding: SIZES.sm,
    marginLeft: SIZES.xs,
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
    marginBottom: SIZES.xs,
  },
  modalSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    marginBottom: SIZES.md,
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
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  productsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  productsModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '80%',
  },
  productsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productsModalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  productsList: {
    padding: SIZES.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    textAlign: 'right',
  },
  productItemPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  moveButton: {
    padding: SIZES.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: SIZES.radiusSm,
  },
});
