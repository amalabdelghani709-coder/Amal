import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AdminInterfaceScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bannerImages, setBannerImages] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setBannerImages(data.banner_images || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const newImage = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setBannerImages([...bannerImages, newImage]);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'حذف الصورة',
      'هل تريد حذف هذه الصورة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const newImages = [...bannerImages];
            newImages.splice(index, 1);
            setBannerImages(newImages);
          },
        },
      ]
    );
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_images: bannerImages }),
      });

      if (response.ok) {
        Alert.alert('تم', 'تم حفظ التغييرات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل حفظ التغييرات');
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
      <View style={styles.header}>
        <Text style={styles.title}>واجهة التطبيق</Text>
        <Text style={styles.subtitle}>الصور الحائطية للصفحة الرئيسية</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Current Banners */}
          <Text style={styles.sectionTitle}>الصور الحالية ({bannerImages.length})</Text>
          
          {bannerImages.map((image, index) => (
            <View key={index} style={styles.bannerCard}>
              <Image source={{ uri: image }} style={styles.bannerImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="trash" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.bannerIndex}>
                <Text style={styles.bannerIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add New Banner */}
          <TouchableOpacity style={styles.addButton} onPress={pickImage}>
            <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
            <Text style={styles.addButtonText}>إضافة صورة جديدة</Text>
          </TouchableOpacity>

          <Button
            title="حفظ التغييرات"
            onPress={saveChanges}
            loading={isSaving}
            size="large"
            style={{ marginTop: SIZES.lg, marginBottom: SIZES.xxl }}
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
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  content: {
    padding: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  bannerCard: {
    position: 'relative',
    marginBottom: SIZES.md,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  bannerImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
  },
  removeButton: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: COLORS.error,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIndex: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIndexText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  addButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xl,
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
  },
  addButtonText: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
    marginTop: SIZES.sm,
  },
});
