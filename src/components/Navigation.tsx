// src/components/Navigation.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Svg, Path } from 'react-native-svg'; // Import for inline SVG component

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

// Define separate header title styles.
const flexfitTitleStyle: StackNavigationOptions['headerTitleStyle'] = {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
};

const defaultTitleStyle: StackNavigationOptions['headerTitleStyle'] = {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// In the Tab Navigator, we disable the header (so only the Stack header appears)
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Entraînement" component={TrainingScreen} />
            <Tab.Screen name="Suivi" component={TrackingScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// Define a well-known inline back arrow component using react-native-svg
const BackArrow = (props: any) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
        <Path
            d="M15 18l-6-6 6-6"
            stroke="black"  // Changed to black
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);


const Navigation: React.FC = () => {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator
                // Global header style with no bottom border, a larger height, and a custom back arrow.
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#fff',
                        elevation: 0, // Removes Android shadow
                        shadowOpacity: 0, // Removes iOS shadow
                        borderBottomWidth: 0, // In case any border is added
                        height: 80, // Increase the header height
                    },
                    headerTintColor: '#007BFF',
                    headerBackTitle: '', // Hides the default back button text
                    headerBackImage: () => (
                        <BackArrow style={{ marginLeft: 16, width: 24, height: 24 }} />
                    ),
                }}
            >
                {!user ? (
                    <>
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ headerTitle: 'FlexFit', headerTitleStyle: flexfitTitleStyle }}
                        />
                        <Stack.Screen
                            name="Auth"
                            component={AuthScreen}
                            options={{ headerTitle: 'Authentification', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="ConfirmSignUp"
                            component={ConfirmSignUpScreen}
                            options={{ headerTitle: 'Confirmer l’inscription', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="ForgotPassword"
                            component={ForgotPasswordScreen}
                            options={{ headerTitle: 'Mot de passe oublié', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="About"
                            component={AboutScreen}
                            options={{ headerTitle: 'À propos', headerTitleStyle: defaultTitleStyle }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="MainTabs"
                            component={MainTabs}
                            options={{ headerTitle: 'FlexFit', headerTitleStyle: flexfitTitleStyle }}
                        />
                        <Stack.Screen
                            name="WorkoutSession"
                            component={WorkoutSessionScreenWrapper}
                            options={({ route }) => ({
                                headerTitle: route.params?.sessionData?.exerciseName ?? 'Workout Session',
                                headerTitleStyle: defaultTitleStyle,
                            })}
                        />
                        <Stack.Screen
                            name="AddEditExercise"
                            component={AddEditExerciseScreen}
                            options={{ headerTitle: 'Exercice', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="TrackingDetail"
                            component={TrackingDetailScreen}
                            options={({ route }) => ({
                                headerTitle: route.params?.tracking?.exerciseName ?? 'Détails du suivi',
                                headerTitleStyle: defaultTitleStyle,
                            })}
                        />
                        <Stack.Screen
                            name="ExerciseHistory"
                            component={ExerciseHistoryScreen}
                            options={{ headerTitle: 'Historique des exercices', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="ManualTracking"
                            component={ManualTrackingScreen}
                            options={{ headerTitle: 'Suivi manuel', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="EditTracking"
                            component={EditTrackingScreen}
                            options={{ headerTitle: 'Modifier le suivi', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="ProfileOptions"
                            component={ProfileOptionsScreen}
                            options={{ headerTitle: 'Options du profil', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="About"
                            component={AboutScreen}
                            options={{ headerTitle: 'À propos', headerTitleStyle: defaultTitleStyle }}
                        />
                    </>
                )}
                {/* Legal screens available to all */}
                <Stack.Screen
                    name="TermsOfUse"
                    component={TermsOfUseScreen}
                    options={{ headerTitle: 'CGU', headerTitleStyle: defaultTitleStyle }}
                />
                <Stack.Screen
                    name="PrivacyPolicy"
                    component={PrivacyPolicyScreen}
                    options={{ headerTitle: 'Politique de Confidentialité', headerTitleStyle: defaultTitleStyle }}
                />
                <Stack.Screen
                    name="LegalNotice"
                    component={LegalNoticeScreen}
                    options={{ headerTitle: 'Mentions Légales', headerTitleStyle: defaultTitleStyle }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;
