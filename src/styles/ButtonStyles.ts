import { StyleSheet } from 'react-native'

export const ButtonStyles = StyleSheet.create({
    primaryContainer: {
        backgroundColor: '#b21ae5',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    primaryText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },

    invertedContainer: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#b21ae5',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    invertedText: {
        color: '#b21ae5',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },

    destructiveContainer: {
        backgroundColor: '#dc3545',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    destructiveText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },

    disabled: {
        opacity: 0.5,
    },
})
