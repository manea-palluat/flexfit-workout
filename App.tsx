// App.tsx
import 'react-native-get-random-values';
import React from 'react';
import AppLoading from 'expo-app-loading';
import { useAppFonts } from './src/utils/useAppFonts';
import Navigation from './src/components/Navigation';
import { AuthProvider } from './src/context/AuthContext';
import './src/aws-setup';

export default function App() {
    const [fontsLoaded] = useAppFonts();

    if (!fontsLoaded) {
        return <AppLoading />;
    }

    return (
        <AuthProvider>
            <Navigation />
        </AuthProvider>
    );
}
