// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Auth } from 'aws-amplify';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';
import { useAuth } from '../context/AuthContext';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const ProfileScreen: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<NavigationProp>();
    const [currentUser, setCurrentUser] = useState(user);

    // Refresh the current authenticated user when the screen is focused.
    useFocusEffect(
        useCallback(() => {
            const refreshUser = async () => {
                try {
                    const updatedUser = await Auth.currentAuthenticatedUser();
                    setCurrentUser(updatedUser);
                } catch (error: any) {
                    // Suppress "not authenticated" errors.
                    if (!error.message || !error.message.toLowerCase().includes('not authenticated')) {
                        console.error('Error refreshing user:', error);
                    }
                    setCurrentUser(null);
                }
            };
            refreshUser();
        }, [])
    );

    // If user is not logged in, display connection buttons.
    if (!currentUser) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Profil</Text>
                <Text style={styles.detail}>Vous n'êtes pas connecté.</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Auth', { mode: 'login' })}
                >
                    <Text style={styles.buttonText}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
                >
                    <Text style={styles.buttonText}>Inscription</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Extract updated values from currentUser.
    const displayName = currentUser.attributes.preferred_username || 'Utilisateur';
    const email = currentUser.attributes.email || 'Email non défini';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil</Text>
            <Text style={styles.detail}>Bienvenue, {displayName}!</Text>
            <Text style={styles.detail}>Email: {email}</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                    try {
                        await signOut();
                    } catch (error) {
                        console.error('Error signing out:', error);
                    }
                }}
            >
                <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.optionsButton]}
                onPress={() => navigation.navigate('ProfileOptions')}
            >
                <Text style={styles.buttonText}>Options du profil</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detail: {
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        width: '80%',
        alignItems: 'center',
    },
    optionsButton: {
        backgroundColor: '#28A745',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ProfileScreen;
