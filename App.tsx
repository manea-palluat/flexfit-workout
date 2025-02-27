// App.tsx
import 'react-native-get-random-values';// permet de générer des valeurs aléatoires sécurisées (ex. UUID)
import React, { useEffect } from 'react';
import AppLoading from 'expo-app-loading';// écran de chargement pendant le load des polices
import { useAppFonts } from './src/utils/useAppFonts';// hook custom pour charger les polices
import Navigation from './src/components/Navigation';// composant qui gère toute la navigation de l'app
import { AuthProvider } from './src/context/AuthContext';// provider pour l'auth (probablement avec un contexte React)
import './src/aws-setup';// setup AWS (AppSync, DynamoDB, Cognito...)
import * as Notifications from 'expo-notifications';// gestion des notifs avec Expo

// GESTION DES NOTIFS EN FOREGROUND
// Ici on définit le comportement des notifs quand l'app est ouverte
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,// affiche une alerte visuelle
        shouldPlaySound: true,// active le son
        shouldSetBadge: false,// pas de badge sur l'icône
    }),
});

export default function App() {
    const [fontsLoaded] = useAppFonts();// charge les polices custom de l'app

    // DEMANDE DE PERMISSION POUR LES NOTIFS
    useEffect(() => {
        async function requestNotificationPermissions() {
            const { status } = await Notifications.getPermissionsAsync();// vérifie si c'est déjà autorisé
            if (status !== 'granted') {// si non, on redemande
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    console.log('Notification permissions not granted');// log au cas où l'utilisateur refuse
                }
            }
        }
        requestNotificationPermissions();// appelle la fonction au mount du composant
    }, []);

    if (!fontsLoaded) {// si les polices sont pas chargées, on affiche un écran de chargement
        return <AppLoading />;
    }

    return (
        <AuthProvider>
            <Navigation />
        </AuthProvider>
    );
}
