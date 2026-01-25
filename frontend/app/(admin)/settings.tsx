import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../src/constants/theme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const API_URL = '';

interface Settings {
  id: string;
  admin_phone: string;
  delivery_fee: number;
  points_percentage: number;
  min_order_for_delivery: number;
  whatsapp_number: string;
  store_name: string;
  store_description: string;
}

export default function AdminSettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [pointsPercentage, setPointsPercentage] = useState('');
  const [minOrder, setMinOrder] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setStoreName(data.store_name || '');
        setStoreDescription(data.store_description || '');
        setAdminPhone(data.admin_phone || '');
        setWhatsappNumber(data.whatsapp_number || '');
        setDeliveryFee(data.delivery_fee?.toString() || '10');
        setPointsPercentage(data.points_percentage?.toString() || '5');
        setMinOrder(data.min_order_for_delivery?.toString() || '0');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName,
          store_description: storeDescription,
          admin_phone: adminPhone,
          whatsapp_number: whatsappNumber,
          delivery_fee: parseFloat(deliveryFee) || 10,
          points_percentage: parseFloat(pointsPercentage) || 5,
          min_order_for_delivery: parseFloat(minOrder) || 0,
        }),
      });

      if (response.ok) {
        Alert.alert('تم', 'تم حفظ الإعدادات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل حفظ الإعدادات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>الإعدادات</Text>
        </View>

        <View style={styles.content}>
          {/* Store Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات المتجر</Text>
            <Input
              label="اسم المتجر"
              value={storeName}
              onChangeText={setStoreName}
              placeholder="دار البقال"
              icon="storefront-outline"
            />
            <Input
              label="وصف المتجر"
              value={storeDescription}
              onChangeText={setStoreDescription}
              placeholder="وصف قصير للمتجر"
              icon="information-circle-outline"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
            <Input
              label="رقم هاتف المتحكم"
              value={adminPhone}
              onChangeText={setAdminPhone}
              placeholder="+212XXXXXXXXX"
              keyboardType="phone-pad"
              icon="call-outline"
            />
            <Input
              label="رقم واتساب"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              placeholder="212XXXXXXXXX"
              keyboardType="phone-pad"
              icon="logo-whatsapp"
            />
          </View>

          {/* Delivery Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إعدادات التوصيل</Text>
            <Input
              label="رسوم التوصيل (درهم)"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              placeholder="10"
              keyboardType="numeric"
              icon="car-outline"
            />
            <Input
              label="الحد الأدنى للطلب (درهم)"
              value={minOrder}
              onChangeText={setMinOrder}
              placeholder="0"
              keyboardType="numeric"
              icon="basket-outline"
            />
          </View>

          {/* Points System */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>نظام النقاط</Text>
            <Input
              label="نسبة النقاط (%)"
              value={pointsPercentage}
              onChangeText={setPointsPercentage}
              placeholder="5"
              keyboardType="numeric"
              icon="gift-outline"
            />
            <Text style={styles.helpText}>
              نسبة من قيمة الطلبية تُضاف كنقاط للزبون
            </Text>
          </View>

          <Button
            title="حفظ الإعدادات"
            onPress={handleSave}
            loading={isSaving}
            size="large"
            style={{ marginTop: SIZES.md, marginBottom: SIZES.xxl }}
          />
        </View>
      </ScrollView>
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
  content: {
    padding: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  helpText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: -SIZES.sm,
  },
});
