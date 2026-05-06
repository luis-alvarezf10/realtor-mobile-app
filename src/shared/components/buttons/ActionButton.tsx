import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // ← agregar
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'confirm' | 'dotted' | 'white';
type IconVariant = 'add' | 'edit' | 'delete' | 'view' | 'save' | 'cancel' | 'reset' | 'close' | 'search' | 'check' | 'redirect' | 'link' | 'image' | 'tag' | 'stars';
type Size = 'sm' | 'md' | 'lg';

// Definir qué variantes usan gradiente y sus colores
const gradientVariants: Partial<Record<Variant, [string, string, ...string[]]>> = {
  primary: ['#ef4444', '#b91c1c'],   // rojo
  confirm: ['#22c55e', '#15803d'],   // verde
  danger:  ['#f97316', '#c2410c'],   // naranja-rojo
};

// Las variantes con gradiente no necesitan bg en NativeWind
const variantStyles: Record<Variant, string> = {
  primary:   '',  // ← vacío, lo maneja el gradiente
  secondary: 'bg-gray-100',
  outline:   'border border-gray-300 bg-transparent',
  ghost:     'bg-transparent',
  danger:    '',  // ← vacío
  glass:     'bg-white border border-gray-200',
  confirm:   '',  // ← vacío
  dotted:    'border-2 border-dashed border-gray-300',
  white:     'bg-white',
};

const sizeStyles: Record<Size, string> = {
  sm: 'min-h-10 px-4 py-2',
  md: 'min-h-12 px-6 py-3',
  lg: 'min-h-14 px-8 py-4',
};

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
  add: 'plus-circle', edit: 'folder-plus', delete: 'delete',
  view: 'eye', save: 'content-save', cancel: 'close-circle',
  reset: 'refresh', close: 'close', search: 'magnify',
  check: 'check', redirect: 'open-in-new', link: 'link',
  image: 'paperclip', tag: 'tag', stars: 'sparkles',
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
  const hasGradient = variant in gradientVariants;
  const isLight = !hasGradient && variant !== 'primary' && variant !== 'danger' && variant !== 'confirm';

  const textColor = isLight ? 'text-gray-700' : 'text-white';
  const iconColor = isLight ? '#374151' : 'white';

  const baseStyles = 'flex-row items-center justify-center rounded-2xl';
  const surfaceClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`.trim();
  const gradientContentClasses = `${baseStyles} ${sizeStyles[size]}`.trim();

  // Contenido compartido entre ambas variantes
  const content = (
    <>
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={isLight ? '#374151' : 'white'}
          style={{ marginRight: 8 }}
        />
      )}
      {iconVariant && !isLoading && (
        <View style={{ marginRight: 8 }}>
          <MaterialCommunityIcons
            name={iconVariantMap[iconVariant] as any}
            size={20}
            color={iconColor}
          />
        </View>
      )}
      {!isLoading && leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
      <Text className={`font-semibold ${textColor}`}>{children}</Text>
      {!isLoading && rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
    </>
  );

  return (
    <TouchableOpacity
      disabled={isLoading || disabled}
      onPress={onPress}
      activeOpacity={0.8}
      className={className}
      style={[{ opacity: isLoading || disabled ? 0.5 : 1 }]}
    >
      {hasGradient ? (
        // Variantes con gradiente
        <LinearGradient
          colors={gradientVariants[variant]!}
          start={{ x: 0, y: 0 }}   // ← dirección: izquierda
          end={{ x: 1, y: 0 }}     //              a derecha
          style={{ borderRadius: 16, width: '100%' }}
        >
          <View className={gradientContentClasses}>
            {content}
          </View>
        </LinearGradient>
      ) : (
        // Variantes sin gradiente
        <View className={surfaceClasses}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}
