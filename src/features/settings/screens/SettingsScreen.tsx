import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';

type SettingsTab = 'perfil' | 'acerca' | 'ayuda';

export function SettingsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, loading } = useAuth();

  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'perfil', label: 'Perfil', icon: 'person-outline' },
    { key: 'acerca', label: 'Acerca', icon: 'information-circle-outline' },
    { key: 'ayuda', label: 'Ayuda', icon: 'help-circle-outline' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <View style={styles.content}>
            {loading ? (
              <Text>Cargando...</Text>
            ) : (
              <>
                {user?.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                  </View>
                )}
                <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
                <Text style={styles.email}>{user?.email || 'usuario@email.com'}</Text>
              </>
            )}
          </View>
        );
      case 'acerca':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Hunter Realtor</Text>
            <Text style={styles.sectionVersion}>v1.0.0</Text>
            <Text style={styles.sectionText}>
              Aplicación móvil para gestión inmobiliaria. Administra propiedades, citas, clientes y reportes desde tu dispositivo.
            </Text>
          </View>
        );
      case 'ayuda':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>¿Necesitas ayuda?</Text>
            <Text style={styles.sectionText}>
              Contacta con soporte para resolver tus dudas o reportar un problema.
            </Text>
            <TouchableOpacity style={styles.helpButton}>
              <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.helpButtonText}>Contactar soporte</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabPill,
                activeTab === tab.key && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === tab.key ? (tab.icon === 'person-outline' ? 'person' : tab.icon === 'information-circle-outline' ? 'information-circle' : 'help-circle') as any : tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#fff' : '#6B7280'}
              />
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {renderContent()}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutDialog(true)}>
        <Ionicons name="log-out-outline" size={20} color="#cc2d19" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showLogoutDialog}
        icon="log-out-outline"
        title="¿Cerrar sesión?"
        description="Tendrás que iniciar sesión nuevamente para acceder"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          setShowLogoutDialog(false);
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
          } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar la sesión');
          }
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  iconButton: {
    padding: 4,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#cc2d19',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#cc2d19',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cc2d19',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cc2d19',
  },
});
