// App.tsx
import 'react-native-get-random-values'; // <-- Add this line at the very top!
import React from 'react';
import Navigation from './src/components/Navigation';
import { AuthProvider } from './src/context/AuthContext';
import './src/aws-setup'; // This file configures Amplify

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Navigation />
        </AuthProvider>
    );
};

export default App;
