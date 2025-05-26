import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput, FormInputProps } from './FormInput';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export interface PasswordInputProps extends Omit<FormInputProps, 'secureTextEntry'> {
    showStrength?: boolean;
    visible?: boolean;
    onToggleVisibility?: () => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
    showStrength = false,
    visible: visibleProp,
    onToggleVisibility,
    style,
    ...props
}) => {
    const [internalVisible, setInternalVisible] = useState(false);
    const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;

    const toggle = () => {
        if (onToggleVisibility) onToggleVisibility();
        else setInternalVisible(v => !v);
    };

    return (
        <>
            <View style={styles.wrapper}>
                <FormInput
                    {...props}
                    secureTextEntry={!visible}
                    style={[style, styles.inputWithIcon]}
                />
                <TouchableOpacity onPress={toggle} style={styles.eyeButton}>
                    <Ionicons name={visible ? 'eye' : 'eye-off'} size={24} color="#b21ae5" />
                </TouchableOpacity>
            </View>
            {showStrength && (
                <View style={styles.strengthContainer}>
                    <PasswordStrengthMeter password={(props.value as string) || ''} />
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        position: 'relative',
    },
    inputWithIcon: {
        paddingRight: 40,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -6 }],
        zIndex: 1,
    },
    strengthContainer: {
        marginTop: 4,
    },
});
