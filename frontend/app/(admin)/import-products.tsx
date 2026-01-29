import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface ImportedProduct {
  name: string;
  category: string;
  cost_price: number;
  price: number;
  stock: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function ImportProductsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [fileName, setFileName] = useState('');

  const pickExcelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);
      setIsLoading(true);

      // قراءة الملف
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        // للويب - استخدام fetch
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsBinaryString(blob);
        });
      } else {
        // للموبايل
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileContent = atob(base64);
      }

      // تحليل ملف Excel
      const workbook = XLSX.read(fileContent, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // تحويل البيانات
      const importedProducts: ImportedProduct[] = jsonData.map((row: any) => {
        // دعم الأعمدة بالعربية والإنجليزية
        const name = row['اسم المنتج'] || row['name'] || row['Name'] || row['المنتج'] || '';
        const category = row['الفئة'] || row['category'] || row['Category'] || row['التصنيف'] || 'عام';
        const costPrice = parseFloat(row['سعر الشراء'] || row['سعر الشراء (د.م)'] || row['cost_price'] || row['Cost'] || 0);
        const sellPrice = parseFloat(row['سعر البيع'] || row['سعر البيع (د.م)'] || row['price'] || row['Price'] || row['السعر'] || 0);
        const stock = parseInt(row['المخزون'] || row['stock'] || row['Stock'] || row['الكمية'] || 100);

        return {
          name: name.toString().trim(),
          category: category.toString().trim(),
          cost_price: isNaN(costPrice) ? 0 : costPrice,
          price: isNaN(sellPrice) ? 0 : sellPrice,
          stock: isNaN(stock) ? 100 : stock,
          status: 'pending' as const,
        };
      }).filter((p: ImportedProduct) => p.name && p.price > 0);

      if (importedProducts.length === 0) {
        Alert.alert('تنبيه', 'لم يتم العثور على منتجات صالحة في الملف.\n\nتأكد من وجود أعمدة:\n- اسم المنتج\n- سعر البيع\n- سعر الشراء (اختياري)\n- الفئة (اختياري)\n- المخزون (اختياري)');
      } else {
        setProducts(importedProducts);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('خطأ', 'فشل قراءة الملف');
    } finally {
      setIsLoading(false);
    }
  };

  const importProducts = async () => {
    if (products.length === 0) return;

    setIsImporting(true);
    const updatedProducts = [...products];

    for (let i = 0; i < updatedProducts.length; i++) {
      const product = updatedProducts[i];
      
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: product.name,
            category: product.category,
            price: product.price,
            cost_price: product.cost_price,
            stock: product.stock,
            description: '',
            image: '',
            unit: '',
            quantity_per_unit: '',
            is_new: true,
            is_discount: false,
            is_active: true,
          }),
        });

        if (response.ok) {
          updatedProducts[i] = { ...product, status: 'success' };
        } else {
          const error = await response.json();
          updatedProducts[i] = { ...product, status: 'error', error: error.detail || 'فشل الإضافة' };
        }
      } catch (error) {
        updatedProducts[i] = { ...product, status: 'error', error: 'خطأ في الاتصال' };
      }

      setProducts([...updatedProducts]);
    }

    setIsImporting(false);

    const successCount = updatedProducts.filter(p => p.status === 'success').length;
    const errorCount = updatedProducts.filter(p => p.status === 'error').length;

    Alert.alert(
      'تم الاستيراد',
      `✅ نجح: ${successCount}\n❌ فشل: ${errorCount}`,
      [
        { text: 'موافق', onPress: () => successCount > 0 && router.back() }
      ]
    );
  };

  const clearProducts = () => {
    setProducts([]);
    setFileName('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />;
      case 'error': return <Ionicons name="close-circle" size={24} color={COLORS.error} />;
      default: return <Ionicons name="time" size={24} color={COLORS.textSecondary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>استيراد المنتجات</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.info} />
        <View style={styles.instructionsText}>
          <Text style={styles.instructionsTitle}>تنسيق الملف المطلوب:</Text>
          <Text style={styles.instructionItem}>• اسم المنتج (مطلوب)</Text>
          <Text style={styles.instructionItem}>• سعر البيع (مطلوب)</Text>
          <Text style={styles.instructionItem}>• سعر الشراء (اختياري)</Text>
          <Text style={styles.instructionItem}>• الفئة (اختياري - افتراضي: عام)</Text>
          <Text style={styles.instructionItem}>• المخزون (اختياري - افتراضي: 100)</Text>
        </View>
      </View>

      {/* File Picker */}
      <TouchableOpacity 
        style={[styles.pickButton, isLoading && styles.buttonDisabled]}
        onPress={pickExcelFile}
        disabled={isLoading}
      >
        <Ionicons 
          name={isLoading ? "hourglass" : "folder-open"} 
          size={32} 
          color={COLORS.white} 
        />
        <Text style={styles.pickButtonText}>
          {isLoading ? 'جاري القراءة...' : 'اختر ملف Excel'}
        </Text>
        {fileName && <Text style={styles.fileName}>{fileName}</Text>}
      </TouchableOpacity>

      {/* Products Preview */}
      {products.length > 0 && (
        <>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              المنتجات ({products.length})
            </Text>
            <TouchableOpacity onPress={clearProducts}>
              <Text style={styles.clearButton}>مسح</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={products}
            renderItem={({ item, index }) => (
              <View style={styles.productCard}>
                <View style={styles.productIndex}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productDetails}>
                    {item.category} • شراء: {item.cost_price} • بيع: {item.price}
                  </Text>
                  {item.error && <Text style={styles.errorText}>{item.error}</Text>}
                </View>
                {getStatusIcon(item.status)}
              </View>
            )}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Import Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.importButton, isImporting && styles.buttonDisabled]}
              onPress={importProducts}
              disabled={isImporting}
            >
              <Ionicons 
                name={isImporting ? "sync" : "cloud-upload"} 
                size={24} 
                color={COLORS.white} 
              />
              <Text style={styles.importButtonText}>
                {isImporting ? 'جاري الاستيراد...' : `استيراد ${products.length} منتج`}
              </Text>
            </TouchableOpacity>
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
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '15',
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
  },
  instructionsText: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  instructionsTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  instructionItem: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  pickButtonText: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.white,
    marginRight: SIZES.sm,
  },
  fileName: {
    fontSize: SIZES.fontSm,
    color: COLORS.white,
    opacity: 0.8,
    marginRight: SIZES.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
  },
  previewTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearButton: {
    fontSize: SIZES.fontMd,
    color: COLORS.error,
    fontWeight: '600',
  },
  list: {
    padding: SIZES.md,
    paddingBottom: 100,
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
  productDetails: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  errorText: {
    fontSize: SIZES.fontSm,
    color: COLORS.error,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.medium,
  },
  importButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.white,
    marginRight: SIZES.sm,
  },
});
