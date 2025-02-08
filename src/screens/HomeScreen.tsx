// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bienvenue sur FlexFit!</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Auth', { mode: 'login' })}
            >
                <Text style={styles.buttonText}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.signupButton]}
                onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            >
                <Text style={styles.buttonText}>Inscription</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aboutButton} onPress={() => navigation.navigate('About')}>
                <Text style={styles.aboutButtonText}>À propos</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,                     // Occupies the full display
        justifyContent: 'center',    // Centers content vertically
        alignItems: 'center',        // Centers content horizontally
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 8,
        marginBottom: 20,
        width: '80%',
        alignItems: 'center',
    },
    signupButton: {
        backgroundColor: '#28A745',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    aboutButton: {
        marginTop: 20,
        padding: 10,
    },
    aboutButtonText: {
        color: '#007BFF',
        fontSize: 16,
    },
});

export default HomeScreen;
