// src/components/common/Button.tsx
import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

interface Props {
    title: string
    onPress: () => void
    variant?: 'primary' | 'inverted'
    disabled?: boolean
}

export default function Button({
    title, onPress, variant = 'primary', disabled
}: Props) {
    return (
        <TouchableOpacity
            style={[
                variant === 'primary' ? s.primary : s.inverted,
                disabled && s.disabled
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={variant === 'primary' ? s.primaryText : s.invertedText}>
                {title}
            </Text>
        </TouchableOpacity>
    )
}

const s = StyleSheet.create({
    primary: {
        backgroundColor: '#b21ae5',
        paddingVertical: 12,
        borderRadius: 50,
        alignItems: 'center',
        marginVertical: 10
    },
    primaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    inverted: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#b21ae5',
        paddingVertical: 12,
        borderRadius: 50,
        alignItems: 'center',
        marginVertical: 10
    },
    invertedText: {
        color: '#b21ae5',
        fontSize: 16,
        fontWeight: '600'
    },
    disabled: {
        opacity: 0.5
    }
})
