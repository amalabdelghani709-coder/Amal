import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  status: string;
}

export default function DriverRouteScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/today`);
      if (response.ok) {
        const data = await response.json();
        // Filter orders that need delivery
        const deliveryOrders = data.filter((o: Order) => 
          ['ready', 'delivering'].includes(o.status) && 
          (o.delivery_latitude || o.delivery_address)
        );
        setOrders(deliveryOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAllInMap = () => {
    if (orders.length === 0) return;

    // Create waypoints string for OpenStreetMap
    const waypoints = orders
      .filter(o => o.delivery_latitude && o.delivery_longitude)
      .map(o => `${o.delivery_latitude},${o.delivery_longitude}`)
      .join('|');

    if (waypoints) {
      // Open first location in map
      const first = orders.find(o => o.delivery_latitude && o.delivery_longitude);
      if (first) {
        Linking.openURL(`https://www.openstreetmap.org/?mlat=${first.delivery_latitude}&mlon=${first.delivery_longitude}#map=14/${first.delivery_latitude}/${first.delivery_longitude}`);
      }
    }
  };

  const openSingleLocation = (order: Order) => {
    if (order.delivery_latitude && order.delivery_longitude) {
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${order.delivery_latitude}&mlon=${order.delivery_longitude}#map=17/${order.delivery_latitude}/${order.delivery_longitude}`);
    } else if (order.delivery_address) {
      Linking.openURL(`https://www.openstreetmap.org/search?query=${encodeURIComponent(order.delivery_address)}`);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>مسار التوصيل</Text>
        <Text style={styles.subtitle}>{orders.length} نقطة توصيل</Text>
      </View>

      {orders.length > 0 && (
        <View style={styles.mapAction}>
          <Button
            title="فتح الخريطة"
            onPress={openAllInMap}
            icon={<Ionicons name="map" size={20} color={COLORS.white} />}
          />
        </View>
      )}

      <FlatList
        data={orders}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.locationCard}
            onPress={() => openSingleLocation(item)}
          >
            <View style={styles.orderNumber}>
              <Text style={styles.orderNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.customerName}>{item.customer_name || 'زبون'}</Text>
              <Text style={styles.customerPhone}>{item.customer_phone}</Text>
              {item.delivery_address && (
                <Text style={styles.address} numberOfLines={2}>{item.delivery_address}</Text>
              )}
            </View>
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد نقاط توصيل</Text>
            <Text style={styles.emptySubtitle}>الطلبيات الجاهزة ستظهر هنا</Text>
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
  mapAction: {
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  list: {
    padding: SIZES.md,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  orderNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  orderNumberText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.fontMd,
  },
  locationInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  customerPhone: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  address: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
    textAlign: 'right',
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
});
