import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { CheckListItem } from './CheckListItem';

interface PasswordStrengthMeterProps {
    password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
    const strengthAnim = useRef(new Animated.Value(0)).current;
    const checklistAnim = useRef(new Animated.Value(0)).current;

    const computeStrength = (pwd: string) => {
        const conditions = [
            pwd.length >= 8,
            /[A-Z]/.test(pwd),
            /[0-9]/.test(pwd),
            /[!@#$%^&*_]/.test(pwd),
        ];
        const count = conditions.filter(Boolean).length;
        return (count / conditions.length) * 100;
    };

    useEffect(() => {
        const strength = computeStrength(password);
        Animated.timing(checklistAnim, {
            toValue: password.length >= 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
        Animated.spring(strengthAnim, {
            toValue: strength,
            friction: 6,
            tension: 80,
            useNativeDriver: false,
        }).start();
    }, [password]);

    const width = strengthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });
    const color = strengthAnim.interpolate({
        inputRange: [0, 50, 100],
        outputRange: ['#FF0000', '#FFA500', '#00AA00'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: checklistAnim }]}>
            <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
            </View>
            <CheckListItem condition={password.trim().length >= 8} text="Au moins 8 caractères" />
            <CheckListItem condition={/[A-Z]/.test(password)} text="Au moins une majuscule" />
            <CheckListItem condition={/[0-9]/.test(password)} text="Au moins un chiffre" />
            <CheckListItem condition={/[!@#$%^&*_]/.test(password)} text="Au moins un caractère spécial" />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    barBackground: {
        width: '100%',
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
});
