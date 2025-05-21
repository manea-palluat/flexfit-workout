import { StyleSheet } from 'react-native'

export const TextInputStyles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    input: {
        backgroundColor: '#f2f0f5',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_400Regular',
        color: '#333',
    },
    focused: {
        borderColor: '#b21ae5',
        borderWidth: 2,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
})
