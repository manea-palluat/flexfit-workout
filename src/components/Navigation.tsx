// src/components/Navigation.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import {
    createStackNavigator,
    StackNavigationOptions,
} from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Svg, Path, Rect, G, Defs, ClipPath } from 'react-native-svg'
import { Text } from 'react-native'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../types/NavigationTypes'
import { TextStyles } from '../styles/TextStyles'

// Barrel imports depuis src/screens/index.ts
import {
    HomeScreen,
    AuthScreen,
    ConfirmSignUpScreen,
    ForgotPasswordScreen,
    TrainingScreen,
    TrackingScreen,
    ProfileScreen,
    AddEditExerciseScreen,
    WorkoutSessionScreen,
    ManualTrackingScreen,
    TrackingDetailScreen,
    EditTrackingScreen,
    ExerciseHistoryScreen,
    RecentExercisesDetailScreen,
    ProfileOptionsScreen,
    ParameterScreen,
    TermsOfUseScreen,
    PrivacyPolicyScreen,
    LegalNoticeScreen,
    AboutScreen,
} from '../screens'

const flexfitTitleStyle: StackNavigationOptions['headerTitleStyle'] = {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
}

const defaultTitleStyle: StackNavigationOptions['headerTitleStyle'] = {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
}

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator<RootStackParamList>()

// SVG path de l’icône haltère
const dumbbellPath: string =
    "M24.0499 15.25H23.2999V12.25C23.2999 11.4216 22.6284 10.75 21.7999 10.75H20.2999V10C20.2999 9.17157 19.6284 8.5 18.7999 8.5H16.5499C15.7215 8.5 15.0499 9.17157 15.0499 10V15.25H10.5499V10C10.5499 9.17157 9.87835 8.5 9.04993 8.5H6.79993C5.9715 8.5 5.29993 9.17157 5.29993 10V10.75H3.79993C2.9715 10.75 2.29993 11.4216 2.29993 12.25V15.25H1.54993C1.13571 15.25 0.799927 15.5858 0.799927 16C0.799927 16.4142 1.13571 16.75 1.54993 16.75H2.29993V19.75C2.29993 20.5784 2.9715 21.25 3.79993 21.25H5.29993V22C5.29993 22.8284 5.9715 23.5 6.79993 23.5H9.04993C9.87835 23.5 10.5499 22.8284 10.5499 22V16.75H15.0499V22C15.0499 22.8284 15.7215 23.5 16.5499 23.5H18.7999C19.6284 23.5 20.2999 22.8284 20.2999 22V21.25H21.7999C22.6284 21.25 23.2999 20.5784 23.2999 19.75V16.75H24.0499C24.4641 16.75 24.7999 16.4142 24.7999 16C24.7999 15.5858 24.4641 15.25 24.0499 15.25Z"

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowOpacity: 0.1,
                },
                tabBarActiveTintColor: '#b21ae5',
                tabBarInactiveTintColor: '#ccc',
                tabBarIcon: ({ focused, size }) => {
                    if (route.name === 'Entraînement') {
                        const iconSize = size * 1.5
                        return (
                            <Svg width={iconSize} height={iconSize} viewBox="0 0 25 32">
                                <Defs>
                                    <ClipPath id="clip-dumbbell">
                                        <Rect width="24" height="24" transform="translate(0.8 4)" />
                                    </ClipPath>
                                </Defs>
                                <G clipPath="url(#clip-dumbbell)">
                                    <Path d={dumbbellPath} fill={focused ? '#b21ae5' : '#ccc'} />
                                </G>
                            </Svg>
                        )
                    }
                    if (route.name === 'Suivi') {
                        return (
                            <Svg width={size} height={size} viewBox="0 0 20 18">
                                <G transform="scale(0.8,1) translate(2,0)">
                                    <Path
                                        d="M19.5499 16.5C19.5499 16.9142 19.2141 17.25 18.7999 17.25H0.799927C0.385713 17.25 0.0499268 16.9142 0.0499268 16.5V1.5C0.0499268 1.08579 0.385713 0.75 0.799927 0.75C1.21414 0.75 1.54993 1.08579 1.54993 1.5V10.3472L6.30586 6.1875C6.57259 5.95401 6.96636 5.93915 7.24993 6.15187L12.7634 10.2872L18.3059 5.4375C18.5039 5.24149 18.7942 5.1714 19.0599 5.2555C19.3255 5.33959 19.5226 5.56402 19.5717 5.83828C19.6209 6.11254 19.5139 6.39143 19.294 6.5625L13.294 11.8125C13.0273 12.046 12.6335 12.0608 12.3499 11.8481L6.83649 7.71469L1.54993 12.3403V15.75H18.7999C19.2141 15.75 19.5499 16.0858 19.5499 16.5Z"
                                        fill={focused ? '#b21ae5' : '#ccc'}
                                    />
                                </G>
                            </Svg>
                        )
                    }
                    if (route.name === 'Profil') {
                        return (
                            <Svg width={size} height={size} viewBox="0 0 25 24">
                                <Defs>
                                    <ClipPath id="clip-profile">
                                        <Rect width="24" height="24" transform="translate(0.4)" />
                                    </ClipPath>
                                </Defs>
                                <G clipPath="url(#clip-profile)">
                                    <Path
                                        d="M22.0488 19.875C20.621 17.4066 18.4206 15.6366 15.8528 14.7975C18.4636 13.2433 19.7142 10.1364 18.9082 7.2069C18.1022 4.27741 15.4384 2.24745 12.4 2.24745C9.36169 2.24745 6.69781 4.27741 5.89184 7.2069C5.08587 10.1364 6.33647 13.2433 8.94721 14.7975C6.3794 15.6356 4.17909 17.4056 2.75127 19.875C2.60873 20.1074 2.60355 20.3989 2.73776 20.6363C2.87196 20.8736 3.1244 21.0194 3.39705 21.0171C3.6697 21.0147 3.9196 20.8646 4.04971 20.625C5.81596 17.5725 8.93784 15.75 12.4 15.75C15.8622 15.75 18.9841 17.5725 20.7503 20.625C20.8805 20.8646 21.1304 21.0147 21.403 21.0171C21.6756 21.0194 21.9281 20.8736 22.0623 20.6363C22.1965 20.3989 22.1913 20.1074 22.0488 19.875V19.875Z"
                                        fill={focused ? '#b21ae5' : '#ccc'}
                                    />
                                </G>
                            </Svg>
                        )
                    }
                },
                tabBarLabel: ({ focused, color }) => {
                    let label = ''
                    if (route.name === 'Entraînement') label = 'Entraînement'
                    else if (route.name === 'Suivi') label = 'Suivi'
                    else if (route.name === 'Profil') label = 'Profil'
                    return (
                        <Text
                            style={[
                                TextStyles.subSimpleText,
                                { color, fontWeight: focused ? 'bold' : 'normal' },
                            ]}
                        >
                            {label}
                        </Text>
                    )
                },
            })}
        >
            <Tab.Screen name="Entraînement" component={TrainingScreen} />
            <Tab.Screen name="Suivi" component={TrackingScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    )
}

function Navigation(): JSX.Element {
    const { user } = useAuth()

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#fff',
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 0,
                        height: 80,
                    },
                    headerTintColor: '#007BFF',
                    headerBackTitle: '',
                    headerBackImage: () => <BackArrow />,
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
                            options={{ headerTitle: 'Confirmer l’inscription', headerTitleStyle: defaultTitleStyle }}
                        >
                            {props => <ConfirmSignUpScreen {...props} />}
                        </Stack.Screen>
                        <Stack.Screen
                            name="ForgotPassword"
                            component={ForgotPasswordScreen}
                            options={{
                                headerTitle: 'Mot de passe oublié',
                                headerTitleStyle: defaultTitleStyle,
                            }}
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
                            options={{
                                headerLeft: () => null,
                                headerTitleStyle: defaultTitleStyle,
                            }}
                        >
                            {props => (
                                <WorkoutSessionScreen
                                    {...props}
                                    sessionData={props.route.params.sessionData}
                                    onComplete={props.route.params.onComplete}
                                    onClose={props.route.params.onClose}
                                />
                            )}
                        </Stack.Screen>
                        <Stack.Screen
                            name="AddEditExercise"
                            component={AddEditExerciseScreen}
                            options={{ headerTitle: 'Exercice', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="TrackingDetail"
                            component={TrackingDetailScreen}
                            options={({ route }) => ({
                                headerTitle: route.params.tracking.exerciseName,
                                headerTitleStyle: defaultTitleStyle,
                            })}
                        />
                        <Stack.Screen
                            name="ExerciseHistory"
                            component={ExerciseHistoryScreen}
                            options={({ route }) => ({
                                headerTitle: route.params.exerciseName,
                                headerTitleStyle: defaultTitleStyle,
                            })}
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
                            name="ParameterScreen"
                            component={ParameterScreen}
                            options={{ headerTitle: 'Paramètres', headerTitleStyle: defaultTitleStyle }}
                        />
                        <Stack.Screen
                            name="RecentExercisesDetail"
                            component={RecentExercisesDetailScreen}
                            options={{ headerTitle: 'Exercices récents', headerTitleStyle: defaultTitleStyle }}
                        />
                    </>
                )}
                <Stack.Screen
                    name="TermsOfUse"
                    component={TermsOfUseScreen}
                    options={{ headerTitle: 'CGU', headerTitleStyle: defaultTitleStyle }}
                />
                <Stack.Screen
                    name="PrivacyPolicy"
                    component={PrivacyPolicyScreen}
                    options={{ headerTitle: 'Politique de confidentialité', headerTitleStyle: defaultTitleStyle }}
                />
                <Stack.Screen
                    name="LegalNotice"
                    component={LegalNoticeScreen}
                    options={{ headerTitle: 'Mentions légales', headerTitleStyle: defaultTitleStyle }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

const BackArrow = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" style={{ marginLeft: 16 }}>
        <Path
            d="M15 18l-6-6 6-6"
            stroke="black"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
)

export default Navigation
