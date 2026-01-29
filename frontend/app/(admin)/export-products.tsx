import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Product {
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

export default function ExportProductsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/all-with-cost`);
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

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}`;
  };

  const exportToExcel = async () => {
    if (products.length === 0) {
      Alert.alert('تنبيه', 'لا توجد منتجات للتصدير');
      return;
    }

    setIsExporting(true);

    try {
      // تحضير البيانات للإكسل
      const excelData = products.map((product, index) => ({
        'الرقم': index + 1,
        'اسم المنتج': product.name,
        'الفئة': product.category,
        'سعر الشراء (د.م)': product.cost_price,
        'سعر البيع (د.م)': product.sell_price,
        'الربح (د.م)': product.profit,
        'نسبة الربح (%)': product.profit_margin,
        'المخزون': product.stock,
        'الحالة': product.is_active ? 'نشط' : 'غير نشط',
      }));

      // إضافة صف الإجماليات
      const totalCost = products.reduce((sum, p) => sum + p.cost_price, 0);
      const totalSell = products.reduce((sum, p) => sum + p.sell_price, 0);
      const totalProfit = products.reduce((sum, p) => sum + p.profit, 0);
      const avgMargin = products.length > 0 
        ? products.reduce((sum, p) => sum + p.profit_margin, 0) / products.length 
        : 0;

      excelData.push({
        'الرقم': '',
        'اسم المنتج': '--- الإجمالي ---',
        'الفئة': '',
        'سعر الشراء (د.م)': totalCost,
        'سعر البيع (د.م)': totalSell,
        'الربح (د.م)': totalProfit,
        'نسبة الربح (%)': Math.round(avgMargin * 10) / 10,
        'المخزون': products.reduce((sum, p) => sum + p.stock, 0),
        'الحالة': '',
      });

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // تعديل عرض الأعمدة
      worksheet['!cols'] = [
        { wch: 8 },   // الرقم
        { wch: 25 },  // اسم المنتج
        { wch: 15 },  // الفئة
        { wch: 18 },  // سعر الشراء
        { wch: 18 },  // سعر البيع
        { wch: 15 },  // الربح
        { wch: 15 },  // نسبة الربح
        { wch: 10 },  // المخزون
        { wch: 12 },  // الحالة
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات');

      // تحويل إلى base64
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

      // اسم الملف مع التاريخ (بالإنجليزية لتجنب مشاكل الترميز)
      const date = new Date().toISOString().split('T')[0];
      const fileName = `DarElBakkal_Products_${date}.xlsx`;

      if (Platform.OS === 'web') {
        // للويب - تحميل مباشر
        try {
          const binaryString = atob(wbout);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert('تم ✅', 'تم تحميل ملف Excel بنجاح');
        } catch (webError) {
          console.error('Web export error:', webError);
          Alert.alert('خطأ', 'فشل تحميل الملف على المتصفح');
        }
      } else {
        // للموبايل - حفظ ومشاركة
        try {
          const filePath = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(filePath, wbout, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // مشاركة الملف
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(filePath, {
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              dialogTitle: 'تصدير المنتجات',
              UTI: 'com.microsoft.excel.xlsx',
            });
          } else {
            Alert.alert('تم ✅', 'تم حفظ الملف بنجاح');
          }
        } catch (mobileError) {
          console.error('Mobile export error:', mobileError);
          Alert.alert('خطأ', 'فشل حفظ الملف على الهاتف');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('خطأ', 'فشل تصدير الملف');
    } finally {
      setIsExporting(false);
    }
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
        <Text style={styles.title}>تصدير المنتجات</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Export Button */}
      <TouchableOpacity 
        style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
        onPress={exportToExcel}
        disabled={isExporting}
      >
        <Ionicons 
          name={isExporting ? "hourglass" : "download"} 
          size={28} 
          color={COLORS.white} 
        />
        <View style={styles.exportButtonText}>
          <Text style={styles.exportTitle}>
            {isExporting ? 'جاري التصدير...' : 'تحميل ملف Excel'}
          </Text>
          <Text style={styles.exportSubtitle}>
            {products.length} منتج • أسعار الشراء والبيع والربح
          </Text>
        </View>
        <Ionicons name="document-text" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{products.length}</Text>
          <Text style={styles.summaryLabel}>منتج</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {products.filter(p => p.is_active).length}
          </Text>
          <Text style={styles.summaryLabel}>نشط</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {products.reduce((sum, p) => sum + p.stock, 0)}
          </Text>
          <Text style={styles.summaryLabel}>إجمالي المخزون</Text>
        </View>
      </View>

      {/* Products Preview */}
      <Text style={styles.previewTitle}>معاينة المنتجات</Text>
      <FlatList
        data={products}
        renderItem={({ item, index }) => (
          <View style={[styles.productCard, !item.is_active && styles.inactiveProduct]}>
            <View style={styles.productIndex}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <View style={styles.pricesColumn}>
              <Text style={styles.costPrice}>شراء: {formatCurrency(item.cost_price)}</Text>
              <Text style={styles.sellPrice}>بيع: {formatCurrency(item.sell_price)}</Text>
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.medium,
  },
  exportButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  exportButtonText: {
    flex: 1,
    marginHorizontal: SIZES.sm,
  },
  exportTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'right',
  },
  exportSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'right',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  previewTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  list: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xl,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
    ...SHADOWS.small,
  },
  inactiveProduct: {
    opacity: 0.5,
  },
  productIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  indexText: {
    fontSize: SIZES.fontSm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productInfo: {
    flex: 1,
    marginHorizontal: SIZES.sm,
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
  pricesColumn: {
    alignItems: 'flex-end',
  },
  costPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.error,
  },
  sellPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.success,
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
});
