// src/styles/ButtonStyles.ts
import { StyleSheet } from 'react-native';

export const ButtonStyles = StyleSheet.create({
    container: {
        backgroundColor: '#b21ae5',
        paddingVertical: 16,
        paddingHorizontal: 50,
        width: '100%',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    destructiveContainer: {
        backgroundColor: '#DC3545',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    destructiveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    invertedContainer: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#b21ae5',
        paddingVertical: 16,
        paddingHorizontal: 50,
        width: '100%',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    invertedText: {
        color: '#b21ae5',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
});
