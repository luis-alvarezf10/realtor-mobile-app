import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddProperty: () => void;
  onAddAppointment: () => void;
  onAddOfferStatus: () => void;
  onUseAI: () => void;
}

export function AddMenu({ visible, onClose, onAddProperty, onAddAppointment, onAddOfferStatus, onUseAI }: AddMenuProps) {
  const menuItems = [
    { icon: 'home-outline', label: 'Propiedad', description: 'Aumenta tu inventario', action: onAddProperty },
    { icon: 'calendar-outline', label: 'Cita', description: 'Agenda una cita a tu calendario', action: onAddAppointment },
    { icon: 'document-text-outline', label: 'Status de Oferta', description: 'Actualiza el estado de una oferta', action: onAddOfferStatus },
    { icon: 'mic-outline', label: 'Registro por Voz', description: 'Dicta tus movimientos con Hunter AI', action: onUseAI },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.dialogContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.dialog}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.menuItem}
                    onPress={() => {
                      item.action();
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon as any} size={22} color="#cc2d19" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(204, 45, 25, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  menuDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
