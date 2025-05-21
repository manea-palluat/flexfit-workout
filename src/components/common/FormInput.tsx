// src/components/common/FormInput.tsx
import React from 'react'
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
} from 'react-native'
import { TextInputStyles } from '../../styles/TextInputStyles'

interface FormInputProps extends TextInputProps {
    label: string
    error?: string
}

const FormInput: React.FC<FormInputProps> = ({
    label,
    error,
    style,
    ...textInputProps
}) => (
    <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[TextInputStyles.input, error && styles.inputError, style]}
            placeholderTextColor="#999"
            {...textInputProps}
        />
        {error ? (
            <Text style={TextInputStyles.errorText}>{error}</Text>
        ) : null}
    </View>
)

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        marginBottom: 6,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    inputError: {
        borderColor: '#DC3545',
        borderWidth: 1,
    },
})

export default FormInput
