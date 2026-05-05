import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'confirm' | 'dotted' | 'white';
type IconVariant = 'add' | 'edit' | 'delete' | 'view' | 'save' | 'cancel' | 'reset' | 'close' | 'search' | 'check' | 'redirect' | 'link' | 'image' | 'tag' | 'stars';
type Size = 'sm' | 'md' | 'lg';

interface ActionButtonProps {
  className?: string;
  variant?: Variant;
  iconVariant?: IconVariant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
}

const iconVariantMap: Record<IconVariant, string> = {
  add: 'plus-circle',
  edit: 'folder-plus',
  delete: 'delete',
  view: 'eye',
  save: 'content-save',
  cancel: 'close-circle',
  reset: 'refresh',
  close: 'close',
  search: 'magnify',
  check: 'check',
  redirect: 'open-in-new',
  link: 'link',
  image: 'paperclip',
  tag: 'tag',
  stars: 'sparkles',
};

const variantStyles: Record<Variant, string> = {
  primary: 'bg-red-600 text-white shadow-md',
  secondary: 'bg-gray-100',
  outline: 'border border-gray-300 bg-transparent',
  ghost: 'bg-transparent',
  danger: 'bg-red-500 text-white',
  glass: 'bg-white rounded-2xl shadow-sm border-gray-200 p-2 text-sm text-gray-700',
  confirm: 'bg-green-500 text-white',
  dotted: 'border-2 border-dashed border-gray-300 text-gray-600',
  white: 'bg-white text-black',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-8 py-5 text-lg',
};

export function ActionButton({
  className = '',
  variant = 'primary',
  iconVariant,
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled = false,
  onPress,
}: ActionButtonProps) {
  const baseStyles = 'flex-row items-center justify-center rounded-2xl font-semibold';
  const combinedClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.replace(/\s+/g, ' ').trim();

  const textColor = variant === 'primary' || variant === 'danger' || variant === 'confirm' ? 'text-white' : 'text-gray-700';
  const iconColor = variant === 'primary' || variant === 'danger' || variant === 'confirm' ? 'white' : '#374151';
  const activityIndicatorColor = variant === 'primary' || variant === 'danger' || variant === 'confirm' ? 'white' : '#374151';

  return (
    <TouchableOpacity
      className={combinedClasses}
      disabled={isLoading || disabled}
      onPress={onPress}
      activeOpacity={0.8}
      style={isLoading || disabled ? { opacity: 0.5 } : {}}
    >
      {isLoading && (
        <ActivityIndicator 
          size="small" 
          color={activityIndicatorColor} 
          style={{ marginRight: 8 }} 
        />
      )}

      {iconVariant && !isLoading && (
        <View style={{ marginRight: 8 }}>
          <MaterialCommunityIcons name={iconVariantMap[iconVariant as keyof typeof iconVariantMap] as any} size={20} color={iconColor} />
        </View>
      )}

      {!isLoading && leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
      
      <Text className={`font-semibold ${textColor}`}>
        {children}
      </Text>
      
      {!isLoading && rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
    </TouchableOpacity>
  );
}
