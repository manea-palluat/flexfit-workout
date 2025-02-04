// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const ProfileScreen: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    // When the user is not logged in, display a message with "Connexion" and "Inscription" buttons.
    if (!user) {
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

    // When the user is logged in, display their details and a logout button.
    const displayName = user?.attributes?.preferred_username || 'Utilisateur';
    const email = user?.attributes?.email || 'Email non défini';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil</Text>
            <Text style={styles.detail}>Bienvenue, {displayName}!</Text>
            <Text style={styles.detail}>Email: {email}</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={async () => await signOut()}
            >
                <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
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
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ProfileScreen;
