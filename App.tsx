// App.tsx
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import AppLoading from 'expo-app-loading';
import { useAppFonts } from './src/utils/useAppFonts';
import Navigation from './src/components/Navigation';
import { AuthProvider } from './src/context/AuthContext';
import './src/aws-setup';
import * as Notifications from 'expo-notifications';

// Set the notification handler so notifications are shown with an alert and sound even when the app is in the foreground.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function App() {
    const [fontsLoaded] = useAppFonts();

    useEffect(() => {
        async function requestNotificationPermissions() {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    console.log('Notification permissions not granted');
                }
            }
        }
        requestNotificationPermissions();
    }, []);

    if (!fontsLoaded) {
        return <AppLoading />;
    }

    return (
        <AuthProvider>
            <Navigation />
        </AuthProvider>
    );
}
