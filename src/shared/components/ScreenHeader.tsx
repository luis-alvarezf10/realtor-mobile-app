import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  companyName?: string;
  onBack?: () => void;
  onNotifications?: () => void;
  onHelp?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLoading?: boolean;
  theme?: 'light' | 'dark';
}

export function ScreenHeader({ title, subtitle, userName, companyName, onBack, onNotifications, onHelp, onEdit, onDelete, deleteLoading, theme = 'light' }: ScreenHeaderProps) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtitleColor = isDark ? '#E5E7EB' : '#6B7280';
  const backgroundColor = isDark ? 'transparent' : '#fff';

  if (userName) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.leftSection}>
          <Ionicons name="person-circle-outline" size={24} color={textColor} />
          <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>{userName}</Text>
        </View>
        <View style={styles.centerSection}>
          <Text style={[styles.goHunter, { color: textColor }]}>Go Hunter</Text>
          {companyName && <Text style={[styles.companyName, { color: subtitleColor }]} numberOfLines={1}>{companyName}</Text>}
        </View>
        <View style={styles.rightSection}>
          {onNotifications && (
            <TouchableOpacity style={styles.iconButton} onPress={onNotifications}>
              <Ionicons name="notifications-outline" size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, onBack && styles.titleWithBack, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rightSection}>
        {onEdit && (
          <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={22} color={textColor} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={styles.iconButton} onPress={onDelete} disabled={deleteLoading}>
            {deleteLoading ? (
              <ActivityIndicator size="small" color="#cc2d19" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#cc2d19" />
            )}
          </TouchableOpacity>
        )}
        {onHelp && (
          <TouchableOpacity style={styles.iconButton} onPress={onHelp}>
            <Ionicons name="help-circle-outline" size={24} color={textColor} />
          </TouchableOpacity>
        )}
        {onNotifications && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotifications}>
            <Ionicons name="notifications-outline" size={24} color={textColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  leftSection: {
    display: 'flex',
    gap: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  goHunter: {
    fontSize: 18,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 12,
    marginTop: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 120,
  },
  titleContainer: {
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  titleWithBack: {
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    padding: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 4,
  },
});
