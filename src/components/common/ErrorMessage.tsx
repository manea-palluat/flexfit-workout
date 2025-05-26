import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';

export interface ErrorMessageProps {
    text: string;
    style?: StyleProp<TextStyle>;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ text, style }) => (
    <Text style={[styles.errorText, style]}>
        {text}
    </Text>
);

const styles = StyleSheet.create({
    errorText: {
        color: '#FF0000',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
});
