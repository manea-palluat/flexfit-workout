// src/screens/ProfileScreen.tsx
// IMPORT DES LIBS : on importe react, ses hooks, et les modules de navigation et d'authentification
import React, { useState, useCallback } from 'react'; // importe react + hooks
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'; // composants RN de base
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // navigation et focus effect
import { Auth } from 'aws-amplify'; // pour gérer l'auth
import { StackNavigationProp } from '@react-navigation/stack'; // typage pour la stack
import type { RootStackParamList } from '../types/NavigationTypes'; // types pour la navigation
import { useAuth } from '../context/AuthContext'; // notre context d'auth

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>; // typage pour aller vers MainTabs

// PROFIL SCREEN
const ProfileScreen: React.FC = () => {
    const { user, signOut } = useAuth(); // récupère user et signOut depuis le context
    const navigation = useNavigation<NavigationProp>(); // navigation typée
    const [currentUser, setCurrentUser] = useState(user); // state pour stocker l'user courant

    // REFRESH AU FOCUS : recharge l'user dès que l'écran est focus
    useFocusEffect(
        useCallback(() => {
            const refreshUser = async () => { // rafraîchit l'user
                try {
                    const updatedUser = await Auth.currentAuthenticatedUser(); // récupère l'user mis à jour
                    setCurrentUser(updatedUser); // met à jour le state
                } catch (error: any) {
                    // on ignore les erreurs "not authenticated"
                    if (!error.message || !error.message.toLowerCase().includes('not authenticated')) {
                        console.error('Error refreshing user:', error);
                    }
                    setCurrentUser(null); // user non connecté
                }
            };
            refreshUser(); // lance la récup dès que l'écran est focus
        }, [])
    );

    // SI user pas connecté : affiche les boutons de connexion et d'inscription
    if (!currentUser) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Profil</Text>
                <Text style={styles.detail}>Vous n'êtes pas connecté.</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Auth', { mode: 'login' })} // redirige vers l'écran de connexion
                >
                    <Text style={styles.buttonText}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Auth', { mode: 'signup' })} // redirige vers l'inscription
                >
                    <Text style={styles.buttonText}>Inscription</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // EXTRATION DES INFOS : récupère le pseudo et l'email depuis currentUser
    const displayName = currentUser.attributes.preferred_username || 'Utilisateur'; // pseudo ou "Utilisateur"
    const email = currentUser.attributes.email || 'Email non défini'; // email ou message alternatif

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil</Text>
            <Text style={styles.detail}>Bienvenue, {displayName}!</Text> // message de bienvenue
            <Text style={styles.detail}>Email: {email}</Text> // affiche l'email
            <TouchableOpacity
                style={styles.button}
                onPress={async () => { // bouton pour se déconnecter
                    try {
                        await signOut(); // déconnexion via le context
                    } catch (error) {
                        console.error('Error signing out:', error);
                    }
                }}
            >
                <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.optionsButton]} // bouton avec style combiné pour les options
                onPress={() => navigation.navigate('ProfileOptions')} // navigue vers les options du profil
            >
                <Text style={styles.buttonText}>Options du profil</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // occupe tout l'espace
        padding: 16, // padding global
        justifyContent: 'center', // centre verticalement
        alignItems: 'center', // centre horizontalement
        backgroundColor: '#fff', // fond blanc
    },
    title: {
        fontSize: 24, // taille du titre
        fontWeight: 'bold',
        marginBottom: 16, // espace sous le titre
    },
    detail: {
        fontSize: 16, // taille du texte detail
        marginBottom: 8, // petit margin
        textAlign: 'center', // centré
    },
    button: {
        backgroundColor: '#007BFF', // bleu pour bouton
        padding: 12, // padding interne
        borderRadius: 8, // coins arrondis
        marginTop: 10, // espace en haut
        width: '80%', // largeur relative
        alignItems: 'center', // centre le texte
    },
    optionsButton: {
        backgroundColor: '#28A745', // vert pour options
    },
    buttonText: {
        color: '#fff', // texte en blanc
        fontSize: 16, // taille du texte
    },
});

export default ProfileScreen;
