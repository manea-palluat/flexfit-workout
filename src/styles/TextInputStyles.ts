// src/styles/TextInputStyles.ts
import { StyleSheet } from 'react-native';

export const TextInputStyles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    input: {
        backgroundColor: '#F2F0F5',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_400Regular',
        color: '#333',
    },
    inputFocused: {
        borderColor: '#b21ae5',
        borderWidth: 2,
    },
    errorText: {
        color: '#DC3545',
        fontSize: 14,
        marginTop: 5,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
});
