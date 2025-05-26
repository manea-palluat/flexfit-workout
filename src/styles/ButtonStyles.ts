import { StyleSheet } from 'react-native';

export const ButtonStyles = StyleSheet.create({
    primaryContainer: {
        width: '100%',
        backgroundColor: '#b21ae5',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    primaryText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },

    invertedContainer: {
        width: '100%',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#b21ae5',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    invertedText: {
        color: '#b21ae5',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },

    destructiveContainer: {
        width: '100%',
        backgroundColor: '#dc3545',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    destructiveText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },

    disabled: {
        opacity: 0.5,
    },
});
