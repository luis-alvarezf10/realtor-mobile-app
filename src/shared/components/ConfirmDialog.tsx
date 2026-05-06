import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description: string;
  icon: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  description,
  icon,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.snackbar, { paddingBottom: 20 + insets.bottom }]}>
              <View style={styles.iconWrapper} className='items-center justify-center self-center mb-5'>
                <Ionicons name={icon as any} size={24} color="#cc2d19" />
              </View>
              <View style={styles.header} className='items-center justify-center'>
                <View style={styles.textContainer}>
                  <Text style={styles.title} className='text-center'>{title}</Text>
                  <Text style={styles.description} className='text-center'>{description}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.actions}>
                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} activeOpacity={0.7}>
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>{cancelLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  snackbar: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  actions: {
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: '#cc2d19',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
