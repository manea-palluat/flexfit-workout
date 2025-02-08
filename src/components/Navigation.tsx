// src/components/Navigation.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import TrainingScreen from '../screens/TrainingScreen';
import TrackingScreen from '../screens/TrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import ConfirmSignUpScreen from '../screens/ConfirmSignUpScreen';
import AddEditExerciseScreen from '../screens/AddEditExerciseScreen';
import TrackingDetailScreen from '../screens/TrackingDetailScreen';
import ExerciseHistoryScreen from '../screens/ExerciseHistoryScreen';
import ManualTrackingScreen from '../screens/ManualTrackingScreen';
import EditTrackingScreen from '../screens/EditTrackingScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileOptionsScreen from '../screens/ProfileOptionsScreen';
import WorkoutSessionScreenWrapper from '../components/WorkoutSessionScreenWrapper';

// New legal screens:
import TermsOfUseScreen from '../screens/TermsOfUseScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import LegalNoticeScreen from '../screens/LegalNoticeScreen';
// New About screen:
import AboutScreen from '../screens/AboutScreen';

import { useAuth } from '../context/AuthContext';
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

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="About" component={AboutScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreenWrapper} />
                        <Stack.Screen name="AddEditExercise" component={AddEditExerciseScreen} />
                        <Stack.Screen name="TrackingDetail" component={TrackingDetailScreen} />
                        <Stack.Screen name="ExerciseHistory" component={ExerciseHistoryScreen} />
                        <Stack.Screen name="ManualTracking" component={ManualTrackingScreen} />
                        <Stack.Screen name="EditTracking" component={EditTrackingScreen} />
                        <Stack.Screen name="ProfileOptions" component={ProfileOptionsScreen} />
                        <Stack.Screen name="About" component={AboutScreen} />
                    </>
                )}
                {/* Legal screens available to all */}
                <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                <Stack.Screen name="LegalNotice" component={LegalNoticeScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;
