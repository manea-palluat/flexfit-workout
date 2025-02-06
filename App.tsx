// App.tsx
import 'react-native-get-random-values';
import React from 'react';
import Navigation from './src/components/Navigation';
import { AuthProvider } from './src/context/AuthContext';
import './src/aws-setup';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
    "The user is not authenticated",
    "The action 'RESET' with payload",
]);

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Navigation />
        </AuthProvider>
    );
};

export default App;
