// src/screens/AuthScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, CommonActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

type Props = {
    navigation: AuthScreenNavigationProp;
    route: AuthScreenRouteProp;
};

const AuthScreen: React.FC<Props> = ({ navigation, route }) => {
    const initialMode = route.params?.mode || 'login';
    const [isSignup, setIsSignup] = useState<boolean>(initialMode === 'signup');
    const [email, setEmail] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>(''); // For "Nom d'utilisateur"
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loginAttempts, setLoginAttempts] = useState<number>(0);
    const { signIn, signUp } = useAuth();

    // Toggle for password visibility.
    const [showPassword, setShowPassword] = useState<boolean>(false);
    // Track whether the password field is focused.
    const [passwordFocused, setPasswordFocused] = useState<boolean>(false);

    // Animated value for the checklist and progress bar container opacity.
    const checklistAnim = useRef(new Animated.Value(0)).current;
    // Animated value for the password strength percentage.
    const strengthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(checklistAnim, {
            toValue: passwordFocused || password.length > 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [passwordFocused, password]);

    // Updated computePasswordStrength using the trimmed password.
    const computePasswordStrength = (pwd: string): number => {
        const trimmed = pwd.trim();
        const conditions = [
            trimmed.length >= 8,
            /[A-Z]/.test(trimmed),
            /[0-9]/.test(trimmed),
            /[!@#$%^&*_]/.test(trimmed)
        ];
        const satisfiedCount = conditions.filter(Boolean).length;
        return satisfiedCount === conditions.length ? 100 : (satisfiedCount / conditions.length) * 100;
    };

    useEffect(() => {
        const strength = computePasswordStrength(password);
        Animated.spring(strengthAnim, {
            toValue: strength,
            friction: 6,
            tension: 80,
            useNativeDriver: false,
        }).start();
    }, [password]);

    // Interpolate the strength value to a relative percentage string.
    const animatedWidth = strengthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    const animatedColor = strengthAnim.interpolate({
        inputRange: [0, 50, 100],
        outputRange: ['#FF0000', '#FFA500', '#00AA00'], // red → orange → green
    });

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        const trimmed = password.trim();
        return (
            trimmed.length >= 8 &&
            /[A-Z]/.test(trimmed) &&
            /[0-9]/.test(trimmed) &&
            /[!@#$%^&*_]/.test(trimmed)
        );
    };

    const storeToken = async (token: string) => {
        await SecureStore.setItemAsync('userToken', token);
    };

    const handleAuth = async () => {
        setError('');
        if (loginAttempts >= 5) {
            setError("Trop de tentatives. Réessayez plus tard.");
            return;
        }
        if (!validateEmail(email)) {
            setError('Veuillez entrer un email valide.');
            return;
        }
        if (!validatePassword(password)) {
            setError(
                'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.'
            );
            return;
        }
        if (isSignup) {
            try {
                await signUp(email, password, displayName);
                navigation.navigate('ConfirmSignUp', { username: email });
            } catch (error: any) {
                handleAuthErrors(error);
            }
        } else {
            try {
                const token = await signIn(email, password);
                await storeToken(token);
                setLoginAttempts(0);
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    })
                );
            } catch (error: any) {
                setLoginAttempts(prev => prev + 1);
                handleAuthErrors(error);
            }
        }
    };

    const handleAuthErrors = (error: any) => {
        console.error('Auth Error:', error);
        if (error.code === 'UsernameExistsException') {
            setError("Cet email est déjà enregistré.");
        } else if (error.code === 'InvalidPasswordException') {
            setError("Le mot de passe ne respecte pas la politique de sécurité.");
        } else if (error.code === 'UserNotFoundException') {
            setError("L'email n'est pas enregistré.");
        } else if (error.code === 'NotAuthorizedException') {
            setError('Mot de passe incorrect.');
        } else if (error.code === 'UserNotConfirmedException') {
            setError("Votre compte n'est pas confirmé. Vérifiez votre email.");
        } else {
            setError(error.message || 'Erreur lors de la connexion.');
        }
    };

    const renderCheckItem = (condition: boolean, text: string) => {
        return (
            <View style={styles.checkItemContainer}>
                <Ionicons
                    name={condition ? 'checkmark-circle-outline' : 'close-circle-outline'}
                    size={16}
                    color={condition ? '#00AA00' : '#FF0000'}
                    style={styles.checkIcon}
                />
                <Text style={styles.checkText}>{text}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isSignup ? 'Inscription' : 'Connexion'}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            {isSignup && (
                <TextInput
                    placeholder="Nom d'utilisateur"
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={styles.input}
                    autoCapitalize="none"
                />
            )}
            {/* Password input with integrated eye icon */}
            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(prev => !prev)}
                    style={styles.eyeButton}
                >
                    <Ionicons
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={24}
                        color="#007BFF"
                    />
                </TouchableOpacity>
            </View>
            {(passwordFocused || password.length > 0) && (
                <Animated.View style={[styles.checklistContainer, { opacity: checklistAnim }]}>
                    <View style={styles.progressContainer}>
                        <Animated.View
                            style={[styles.progressBar, { width: animatedWidth, backgroundColor: animatedColor }]}
                        />
                    </View>
                    <View style={styles.checklist}>
                        {renderCheckItem(password.trim().length >= 8, 'Au moins 8 caractères')}
                        {renderCheckItem(/[A-Z]/.test(password.trim()), 'Au moins une majuscule')}
                        {renderCheckItem(/[0-9]/.test(password.trim()), 'Au moins un chiffre')}
                        {renderCheckItem(/[!@#$%^&*_]/.test(password.trim()), 'Au moins un caractère spécial')}
                    </View>
                </Animated.View>
            )}
            <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <Text style={styles.buttonText}>
                    {isSignup ? 'S’inscrire' : 'Se connecter'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => {
                    setIsSignup(!isSignup);
                    setError('');
                }}
            >
                <Text style={styles.linkText}>
                    {isSignup ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Inscription'}
                </Text>
            </TouchableOpacity>
            {!isSignup && (
                <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                >
                    <Text style={styles.forgotPasswordText}>J'ai oublié mon mot de passe</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
    },
    input: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    passwordContainer: {
        width: '80%',
        position: 'relative',
        marginBottom: 10,
    },
    passwordInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        paddingRight: 40,
    },
    eyeButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    linkText: {
        color: '#007BFF',
        marginTop: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
        width: '80%',
    },
    forgotPasswordButton: {
        marginTop: 20,
    },
    forgotPasswordText: {
        color: '#007BFF',
        fontSize: 16,
    },
    backButton: {
        marginTop: 20,
        padding: 10,
    },
    backButtonText: {
        color: '#007BFF',
        fontSize: 16,
    },
    checklistContainer: {
        width: '80%',
        marginBottom: 10,
    },
    progressContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    checklist: {},
    checkItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    checkIcon: {
        marginRight: 4,
    },
    checkText: {
        fontSize: 14,
        color: '#333',
    },

});

export default AuthScreen;
