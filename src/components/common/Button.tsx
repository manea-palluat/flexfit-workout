import React from 'react';
import { TouchableOpacity, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { ButtonStyles } from '../../styles/ButtonStyles';

export type ButtonVariant = 'primary' | 'inverted' | 'destructive';

export interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
}) => {
    const containerStyles: StyleProp<ViewStyle> = [
        { width: '100%' },
        variant === 'primary' && ButtonStyles.primaryContainer,
        variant === 'inverted' && ButtonStyles.invertedContainer,
        variant === 'destructive' && ButtonStyles.destructiveContainer,
        disabled && ButtonStyles.disabled,
        style,
    ];

    const titleStyles: StyleProp<TextStyle> = [
        variant === 'primary' && ButtonStyles.primaryText,
        variant === 'inverted' && ButtonStyles.invertedText,
        variant === 'destructive' && ButtonStyles.destructiveText,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={containerStyles}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
        >
            <Text style={titleStyles}>
                {loading ? '...' : title}
            </Text>
        </TouchableOpacity>
    );
};
