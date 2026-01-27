import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Settings {
  banner_images: string[];
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  theme_mode: string;
  products_display: string;
  products_columns: number;
  show_new_products: boolean;
  show_discounts: boolean;
  show_categories: boolean;
  show_banner: boolean;
  welcome_message: string;
  order_success_message: string;
  order_preparing_message: string;
  order_delivering_message: string;
  order_delivered_message: string;
  empty_cart_message: string;
  cart_icon: string;
  search_icon: string;
  home_icon: string;
  profile_icon: string;
  orders_icon: string;
}

const AVAILABLE_ICONS = [
  'cart', 'cart-outline', 'bag', 'bag-outline', 'basket', 'basket-outline',
  'search', 'search-outline', 'home', 'home-outline', 'storefront', 'storefront-outline',
  'person', 'person-outline', 'people', 'people-outline',
  'receipt', 'receipt-outline', 'document-text', 'document-text-outline',
  'heart', 'heart-outline', 'star', 'star-outline',
  'gift', 'gift-outline', 'pricetag', 'pricetag-outline',
];

const COLOR_PRESETS = [
  '#2E7D32', '#1976D2', '#7B1FA2', '#C62828', '#F57C00', '#00796B',
  '#5D4037', '#455A64', '#E91E63', '#3F51B5', '#009688', '#FF5722',
];

export default function AdminInterfaceScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<'banners' | 'colors' | 'sections' | 'texts' | 'icons' | 'display'>('banners');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIconField, setSelectedIconField] = useState<string>('');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        Alert.alert('تم', 'تم حفظ التغييرات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل حفظ التغييرات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const newBanners = [...(settings?.banner_images || []), base64Image];
      updateSettings({ banner_images: newBanners });
    }
  };

  const removeBanner = (index: number) => {
    Alert.alert(
      'حذف الصورة',
      'هل تريد حذف هذه الصورة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const newBanners = settings?.banner_images.filter((_, i) => i !== index) || [];
            updateSettings({ banner_images: newBanners });
          },
        },
      ]
    );
  };

  const selectIcon = (icon: string) => {
    if (selectedIconField && settings) {
      updateSettings({ [selectedIconField]: icon });
    }
    setShowIconPicker(false);
  };

  if (isLoading || !settings) {
    return <LoadingScreen />;
  }

  const tabs = [
    { id: 'banners', label: 'الصور', icon: 'images-outline' },
    { id: 'colors', label: 'الألوان', icon: 'color-palette-outline' },
    { id: 'sections', label: 'الأقسام', icon: 'grid-outline' },
    { id: 'display', label: 'العرض', icon: 'eye-outline' },
    { id: 'texts', label: 'النصوص', icon: 'text-outline' },
    { id: 'icons', label: 'الأيقونات', icon: 'shapes-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة واجهة التطبيق</Text>
        <Text style={styles.subtitle}>تخصيص مظهر التطبيق</Text>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.id ? COLORS.white : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={styles.content}
      >
        {/* Banners Tab */}
        {activeTab === 'banners' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الصور الحائطية</Text>
            <Text style={styles.sectionDesc}>صور البانر في الصفحة الرئيسية</Text>

            <View style={styles.bannersGrid}>
              {settings.banner_images.map((image, index) => (
                <View key={index} style={styles.bannerItem}>
                  <Image source={{ uri: image }} style={styles.bannerImage} />
                  <TouchableOpacity
                    style={styles.bannerRemove}
                    onPress={() => removeBanner(index)}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addBanner} onPress={pickImage}>
                <Ionicons name="add-circle-outline" size={48} color={COLORS.primary} />
                <Text style={styles.addBannerText}>إضافة صورة</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الألوان والثيم</Text>
            
            {/* Theme Mode */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>الوضع الداكن</Text>
              <Switch
                value={settings.theme_mode === 'dark'}
                onValueChange={(value) => updateSettings({ theme_mode: value ? 'dark' : 'light' })}
                trackColor={{ true: COLORS.primary }}
              />
            </View>

            {/* Primary Color */}
            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>اللون الرئيسي</Text>
              <View style={styles.colorPreview} backgroundColor={settings.primary_color} />
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      settings.primary_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ primary_color: color })}
                  />
                ))}
              </View>
            </View>

            {/* Secondary Color */}
            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>اللون الثانوي</Text>
              <View style={styles.colorPreview} backgroundColor={settings.secondary_color} />
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      settings.secondary_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ secondary_color: color })}
                  />
                ))}
              </View>
            </View>

            {/* Accent Color */}
            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>لون التمييز</Text>
              <View style={styles.colorPreview} backgroundColor={settings.accent_color} />
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      settings.accent_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ accent_color: color })}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إدارة الأقسام</Text>
            <Text style={styles.sectionDesc}>إظهار/إخفاء أقسام الصفحة الرئيسية</Text>

            <View style={styles.togglesContainer}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.settingLabel}>البانر الرئيسي</Text>
                </View>
                <Switch
                  value={settings.show_banner}
                  onValueChange={(value) => updateSettings({ show_banner: value })}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="sparkles-outline" size={24} color={COLORS.success} />
                  <Text style={styles.settingLabel}>منتجات جديدة</Text>
                </View>
                <Switch
                  value={settings.show_new_products}
                  onValueChange={(value) => updateSettings({ show_new_products: value })}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="pricetag-outline" size={24} color={COLORS.error} />
                  <Text style={styles.settingLabel}>التخفيضات</Text>
                </View>
                <Switch
                  value={settings.show_discounts}
                  onValueChange={(value) => updateSettings({ show_discounts: value })}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="apps-outline" size={24} color={COLORS.secondary} />
                  <Text style={styles.settingLabel}>الفئات</Text>
                </View>
                <Switch
                  value={settings.show_categories}
                  onValueChange={(value) => updateSettings({ show_categories: value })}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>طريقة عرض المنتجات</Text>

            {/* Display Mode */}
            <Text style={styles.subLabel}>نمط العرض</Text>
            <View style={styles.displayOptions}>
              <TouchableOpacity
                style={[
                  styles.displayOption,
                  settings.products_display === 'grid' && styles.displayOptionActive,
                ]}
                onPress={() => updateSettings({ products_display: 'grid' })}
              >
                <Ionicons 
                  name="grid" 
                  size={32} 
                  color={settings.products_display === 'grid' ? COLORS.white : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.displayOptionText,
                  settings.products_display === 'grid' && styles.displayOptionTextActive,
                ]}>شبكة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.displayOption,
                  settings.products_display === 'list' && styles.displayOptionActive,
                ]}
                onPress={() => updateSettings({ products_display: 'list' })}
              >
                <Ionicons 
                  name="list" 
                  size={32} 
                  color={settings.products_display === 'list' ? COLORS.white : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.displayOptionText,
                  settings.products_display === 'list' && styles.displayOptionTextActive,
                ]}>قائمة</Text>
              </TouchableOpacity>
            </View>

            {/* Columns */}
            {settings.products_display === 'grid' && (
              <>
                <Text style={styles.subLabel}>عدد الأعمدة</Text>
                <View style={styles.columnsOptions}>
                  {[1, 2, 3].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.columnOption,
                        settings.products_columns === num && styles.columnOptionActive,
                      ]}
                      onPress={() => updateSettings({ products_columns: num })}
                    >
                      <Text style={[
                        styles.columnOptionText,
                        settings.products_columns === num && styles.columnOptionTextActive,
                      ]}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Texts Tab */}
        {activeTab === 'texts' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>النصوص والإشعارات</Text>

            <View style={styles.textInput}>
              <Text style={styles.inputLabel}>رسالة الترحيب</Text>
              <TextInput
                style={styles.input}
                value={settings.welcome_message}
                onChangeText={(text) => setSettings({ ...settings, welcome_message: text })}
                onBlur={() => updateSettings({ welcome_message: settings.welcome_message })}
                placeholder="مرحباً بك..."
                textAlign="right"
              />
            </View>

            <View style={styles.textInput}>
              <Text style={styles.inputLabel}>رسالة نجاح الطلب</Text>
              <TextInput
                style={styles.input}
                value={settings.order_success_message}
                onChangeText={(text) => setSettings({ ...settings, order_success_message: text })}
                onBlur={() => updateSettings({ order_success_message: settings.order_success_message })}
                placeholder="تم استلام طلبك..."
                textAlign="right"
                multiline
              />
            </View>

            <View style={styles.textInput}>
              <Text style={styles.inputLabel}>رسالة التحضير</Text>
              <TextInput
                style={styles.input}
                value={settings.order_preparing_message}
                onChangeText={(text) => setSettings({ ...settings, order_preparing_message: text })}
                onBlur={() => updateSettings({ order_preparing_message: settings.order_preparing_message })}
                placeholder="طلبك قيد التحضير..."
                textAlign="right"
              />
            </View>

            <View style={styles.textInput}>
              <Text style={styles.inputLabel}>رسالة التوصيل</Text>
              <TextInput
                style={styles.input}
                value={settings.order_delivering_message}
                onChangeText={(text) => setSettings({ ...settings, order_delivering_message: text })}
                onBlur={() => updateSettings({ order_delivering_message: settings.order_delivering_message })}
                placeholder="طلبك في الطريق..."
                textAlign="right"
              />
            </View>

            <View style={styles.textInput}>
              <Text style={styles.inputLabel}>رسالة التسليم</Text>
              <TextInput
                style={styles.input}
                value={settings.order_delivered_message}
                onChangeText={(text) => setSettings({ ...settings, order_delivered_message: text })}
                onBlur={() => updateSettings({ order_delivered_message: settings.order_delivered_message })}
                placeholder="تم توصيل طلبك..."
                textAlign="right"
              />
            </View>

            <View style={styles.textInput}>
              <Text style={styles.inputLabel}>رسالة السلة الفارغة</Text>
              <TextInput
                style={styles.input}
                value={settings.empty_cart_message}
                onChangeText={(text) => setSettings({ ...settings, empty_cart_message: text })}
                onBlur={() => updateSettings({ empty_cart_message: settings.empty_cart_message })}
                placeholder="سلتك فارغة..."
                textAlign="right"
              />
            </View>
          </View>
        )}

        {/* Icons Tab */}
        {activeTab === 'icons' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إدارة الأيقونات</Text>
            <Text style={styles.sectionDesc}>تخصيص أيقونات التطبيق</Text>

            {[
              { key: 'home_icon', label: 'أيقونة الرئيسية', current: settings.home_icon },
              { key: 'cart_icon', label: 'أيقونة السلة', current: settings.cart_icon },
              { key: 'search_icon', label: 'أيقونة البحث', current: settings.search_icon },
              { key: 'profile_icon', label: 'أيقونة الحساب', current: settings.profile_icon },
              { key: 'orders_icon', label: 'أيقونة الطلبيات', current: settings.orders_icon },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.iconRow}
                onPress={() => {
                  setSelectedIconField(item.key);
                  setShowIconPicker(true);
                }}
              >
                <View style={styles.iconInfo}>
                  <View style={styles.iconPreview}>
                    <Ionicons name={item.current as any} size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.iconLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowIconPicker(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>اختر أيقونة</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.iconsGrid}>
            {AVAILABLE_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={styles.iconOption}
                onPress={() => selectIcon(icon)}
              >
                <Ionicons name={icon as any} size={32} color={COLORS.text} />
                <Text style={styles.iconName}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingBox}>
            <Text style={styles.savingText}>جاري الحفظ...</Text>
          </View>
        </View>
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
  tabsContainer: {
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    gap: SIZES.xs,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    padding: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  sectionDesc: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
    textAlign: 'right',
  },
  // Banners
  bannersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  bannerItem: {
    width: '48%',
    aspectRatio: 16 / 9,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.white,
    borderRadius: 14,
  },
  addBanner: {
    width: '48%',
    aspectRatio: 16 / 9,
    borderRadius: SIZES.radiusMd,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBannerText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    marginTop: SIZES.xs,
  },
  // Colors
  colorSection: {
    marginBottom: SIZES.lg,
  },
  colorLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'right',
  },
  colorPreview: {
    width: 60,
    height: 30,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    alignSelf: 'flex-end',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  // Settings Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  settingLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
  togglesContainer: {
    marginTop: SIZES.sm,
  },
  // Display Options
  subLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
    marginTop: SIZES.md,
    textAlign: 'right',
  },
  displayOptions: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  displayOption: {
    flex: 1,
    alignItems: 'center',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.background,
  },
  displayOptionActive: {
    backgroundColor: COLORS.primary,
  },
  displayOptionText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  displayOptionTextActive: {
    color: COLORS.white,
  },
  columnsOptions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  columnOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnOptionActive: {
    backgroundColor: COLORS.primary,
  },
  columnOptionText: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  columnOptionTextActive: {
    color: COLORS.white,
  },
  // Text Inputs
  textInput: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    minHeight: 48,
  },
  // Icons
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
  // Modal
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
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  iconOption: {
    width: '22%',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.surface,
  },
  iconName: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  // Saving Overlay
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingBox: {
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
  },
  savingText: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
});
