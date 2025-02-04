// src/components/Navigation.tsx
import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import TrainingScreen from '../screens/TrainingScreen';
import TrackingScreen from '../screens/TrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import ConfirmSignUpScreen from '../screens/ConfirmSignUpScreen';
import AddEditExerciseScreen from '../screens/AddEditExerciseScreen';

import { useAuth } from '../context/AuthContext';
import NotLoggedInModal from './NotLoggedInModal';
import type { RootStackParamList } from '../types/NavigationTypes';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function MainTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Entraînement" component={TrainingScreen} />
            <Tab.Screen name="Suivi" component={TrackingScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const Navigation: React.FC = () => {
    const { user } = useAuth();
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    useEffect(() => {
        setModalVisible(!user);
    }, [user]);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false, presentation: 'modal' }}
            >
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
                <Stack.Screen name="AddEditExercise" component={AddEditExerciseScreen} />
            </Stack.Navigator>
            <NotLoggedInModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </NavigationContainer>
    );
};

export default Navigation;
