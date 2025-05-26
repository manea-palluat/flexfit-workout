// src/components/form/FormInput.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { TextInputStyles } from '../../styles/TextInputStyles';
import { TextStyles } from '../../styles/TextStyles';

export interface FormInputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    error,
    style,
    ...props
}) => (
    <View style={styles.wrapper}>
        {label && <Text style={[TextStyles.headerText, styles.label]}>{label}</Text>}
        <View style={[TextInputStyles.container, styles.inputContainer]}>
            <TextInput
                {...props}
                style={[TextInputStyles.input, style]}
                placeholderTextColor="#999"
            />
        </View>
        {error ? <Text style={TextInputStyles.errorText}>{error}</Text> : null}
    </View>
);

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: 16,
        alignItems: 'center',
    },
    label: {
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    inputContainer: {
        width: '100%',
    },
});
