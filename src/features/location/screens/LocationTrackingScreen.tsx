import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function LocationTrackingScreen({ route }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isNearProperty, setIsNearProperty] = useState(false);

  const propertyLocation = route?.params?.propertyLocation || {
    latitude: -34.6037,
    longitude: -58.3816,
    name: 'Casa en Zona Norte'
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      propertyLocation.latitude,
      propertyLocation.longitude
    );

    setIsNearProperty(distance < 0.5);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verificación de Ubicación</Text>
        <Text style={styles.headerSubtitle}>{propertyLocation.name}</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, isNearProperty ? styles.iconSuccess : styles.iconWarning]}>
          <Ionicons
            name={isNearProperty ? 'checkmark-circle' : 'location'}
            size={64}
            color={isNearProperty ? '#16A34A' : '#CA8A04'}
          />
        </View>

        <Text style={[styles.statusText, isNearProperty ? styles.statusSuccess : styles.statusWarning]}>
          {isNearProperty ? 'En ubicación' : 'Verificando...'}
        </Text>

        <Text style={styles.message}>
          {isNearProperty
            ? 'Estás en la ubicación de la propiedad. La cita puede proceder.'
            : 'Verificando si te encuentras en la ubicación de la propiedad...'}
        </Text>

        {location && (
          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>Tu ubicación actual:</Text>
            <Text style={styles.locationCoords}>{location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={getCurrentLocation}
        >
          <Text style={styles.buttonText}>Actualizar Ubicación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconSuccess: {
    backgroundColor: '#DCFCE7',
  },
  iconWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusSuccess: {
    color: '#16A34A',
  },
  statusWarning: {
    color: '#CA8A04',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 14,
    color: '#374151',
  },
  locationCoords: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
