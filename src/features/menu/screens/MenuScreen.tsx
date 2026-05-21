import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { GradientBackground } from '../../../shared/components/GradientBackground';

export function MenuScreen({ navigation }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <GradientBackground>
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menú</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.userCard}>
        {user?.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullname?.charAt(0) || 'U'}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.fullname || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>Gestión Financiera</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recordsScroll}
        style={styles.recordsContainer}
      >
        <TouchableOpacity style={styles.recordItem}>
          <View style={styles.recordIcon}>
            <Ionicons name="flag-outline" size={24} color="#cc2d19" />
          </View>
          <Text style={styles.recordLabel}>Estados de citas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.recordItem}>
          <View style={styles.recordIcon}>
            <Ionicons name="trending-up-outline" size={24} color="#cc2d19" />
          </View>
          <Text style={styles.recordLabel}>Estadísticas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.recordItem}>
          <View style={styles.recordIcon}>
            <Ionicons name="wallet-outline" size={24} color="#cc2d19" />
          </View>
          <Text style={styles.recordLabel}>Finanzas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.recordItem}>
          <View style={styles.recordIcon}>
            <Ionicons name="swap-horizontal-outline" size={24} color="#cc2d19" />
          </View>
          <Text style={styles.recordLabel}>Transacciones</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={[styles.sectionSubtitle, styles.sectionSubtitleLess]}>Registros</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recordsScroll}
        style={styles.recordsContainer}
      >
        <TouchableOpacity style={styles.recordItem}>
          <View style={styles.recordIcon}>
            <Ionicons name="people-outline" size={24} color="#cc2d19" />
          </View>
          <Text style={styles.recordLabel}>Clientes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconButton: {
    padding: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 26,
    backgroundColor: '#cc2d19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  userPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
    marginVertical: 10
  },
  sectionSubtitleLess: {
    paddingTop: 8,
  },
  recordsScroll: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
  },
  recordsContainer: {
    flexGrow: 0,
    flexShrink: 0,
    height: 104,
    marginBottom: 4,
  },
  recordItem: {
    alignItems: 'center',
    width: 85,
  },
  recordIcon: {
    width: 60,
    height: 60,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
});
