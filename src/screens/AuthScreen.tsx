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
import { TextInputStyles } from '../styles/TextInputStyles';
import { TextStyles } from '../styles/TextStyles';
import { ButtonStyles } from '../styles/ButtonStyles';

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
    const [confirmPassword, setConfirmPassword] = useState<string>(''); // Confirm password input
    const [error, setError] = useState<string>('');
    const [loginAttempts, setLoginAttempts] = useState<number>(0);
    const { signIn, signUp } = useAuth();

    // Field-specific error states
    const [emailError, setEmailError] = useState<string>('');
    const [displayNameError, setDisplayNameError] = useState<string>('');
    const [passwordMatchError, setPasswordMatchError] = useState<string>('');

    // Toggle for password visibility.
    const [showPassword, setShowPassword] = useState<boolean>(false);
    // Track whether the first password field is focused.
    const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
    // Create a ref for the first password input.
    const passwordRef = useRef<TextInput>(null);

    // Animated values for checklist opacity and password strength.
    const checklistAnim = useRef(new Animated.Value(0)).current;
    const strengthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(checklistAnim, {
            toValue: passwordFocused || password.length > 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [passwordFocused, password]);

    // Compute password strength (as a percentage)
    const computePasswordStrength = (pwd: string): number => {
        const trimmed = pwd.trim();
        const conditions = [
            trimmed.length >= 8,
            /[A-Z]/.test(trimmed),
            /[0-9]/.test(trimmed),
            /[!@#$%^&*_]/.test(trimmed)
        ];
        const satisfiedCount = conditions.filter(Boolean).length;
        return satisfiedCount === conditions.length
            ? 100
            : (satisfiedCount / conditions.length) * 100;
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

    // Interpolations for animated progress bar.
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

    const validateDisplayName = (name: string) => {
        // Maximum 16 characters; allowed: letters, numbers, underscore, dot.
        const displayNameRegex = /^[A-Za-z0-9_.]{1,16}$/;
        return displayNameRegex.test(name);
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
        if (isSignup && password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (isSignup && !validateDisplayName(displayName)) {
            setError("Le nom d'utilisateur doit comporter au maximum 16 caractères et ne contenir que des lettres, chiffres, underscores et points.");
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

    // Error handling with friendly French messages.
    // Additionally, if the error is "UserNotConfirmedException", redirect the user to the confirmation screen.
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
            // Redirect user to the confirmation screen if not confirmed.
            navigation.navigate('ConfirmSignUp', { username: email });
        } else {
            setError(error.message || 'Erreur lors de la connexion.');
        }
    };

    // Render a checklist item for the password criteria
    const renderCheckItem = (condition: boolean, text: string) => (
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

    // Determine if the "S'inscrire" button should be enabled.
    // For sign-up: email, displayName, password, and confirmPassword must be valid.
    const canSubmit = isSignup
        ? (
            validateEmail(email) &&
            email.trim() !== '' &&
            validateDisplayName(displayName) &&
            displayName.trim() !== '' &&
            validatePassword(password) &&
            password.trim() !== '' &&
            password === confirmPassword &&
            confirmPassword.trim() !== ''
        )
        : (
            validateEmail(email) &&
            email.trim() !== '' &&
            password.trim() !== ''
        );

    return (
        <View style={styles.container}>
            {/* Title with extra bottom margin */}
            <Text style={[TextStyles.title, { marginBottom: 20 }]}>
                {isSignup ? 'Inscription' : 'Connexion'}
            </Text>
            {error ? (
                <Text style={[TextInputStyles.errorText, { textAlign: 'center', marginBottom: 20 }]}>
                    {error}
                </Text>
            ) : null}

            {/* Common form container */}
            <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={[TextInputStyles.container, styles.inputContainer]}>
                    <TextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={text => { setEmail(text); setEmailError(''); }}
                        onBlur={() => {
                            if (!validateEmail(email)) {
                                setEmailError("L'adresse email n'est pas valide.");
                            } else {
                                setEmailError('');
                            }
                        }}
                        style={TextInputStyles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {emailError ? (
                        <Text style={styles.validationErrorText}>{emailError}</Text>
                    ) : null}
                </View>

                {/* Username Input (only for signup) */}
                {isSignup && (
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            placeholder="Nom d'utilisateur"
                            value={displayName}
                            onChangeText={text => { setDisplayName(text); setDisplayNameError(''); }}
                            onBlur={() => {
                                if (!validateDisplayName(displayName)) {
                                    setDisplayNameError("Le nom d'utilisateur doit comporter au maximum 16 caractères et ne contenir que des lettres, chiffres, underscores et points.");
                                } else {
                                    setDisplayNameError('');
                                }
                            }}
                            style={TextInputStyles.input}
                            autoCapitalize="none"
                        />
                        {displayNameError ? (
                            <Text style={styles.validationErrorText}>{displayNameError}</Text>
                        ) : null}
                    </View>
                )}

                {/* Password Input with Eye Icon */}
                <View style={styles.passwordContainer}>
                    <TextInput
                        ref={passwordRef}
                        placeholder="Mot de passe"
                        value={password}
                        onChangeText={setPassword}
                        style={[TextInputStyles.input, { paddingRight: 40 }]}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => {
                            setPasswordFocused(false);
                            if (isSignup && confirmPassword.length > 0 && password !== confirmPassword) {
                                setPasswordMatchError("Les mots de passe ne correspondent pas.");
                            } else {
                                setPasswordMatchError('');
                            }
                        }}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(prev => !prev)}
                        style={styles.eyeButton}
                    >
                        <Ionicons
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={24}
                            color="#b21ae5"
                        />
                    </TouchableOpacity>
                </View>

                {/* Confirm Password Input (only for signup) */}
                {isSignup && (
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={TextInputStyles.input}
                            secureTextEntry={!showPassword}
                            onFocus={() => {
                                if (passwordRef.current) {
                                    passwordRef.current.blur(); // Unfocus the first password input
                                }
                                setPasswordFocused(false); // Close the checklist
                            }}
                        />
                        {passwordMatchError ? (
                            <Text style={styles.validationErrorText}>{passwordMatchError}</Text>
                        ) : null}
                    </View>
                )}

                {/* Render the password checklist only on sign-up when the first password input is focused */}
                {isSignup && passwordFocused && (
                    <Animated.View style={styles.checklistContainer}>
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

                {/* Main Authentication Button */}
                <TouchableOpacity
                    style={[ButtonStyles.container, !canSubmit && { opacity: 0.5 }]}
                    onPress={handleAuth}
                    disabled={!canSubmit}
                >
                    <Text style={ButtonStyles.text}>
                        {isSignup ? 'S’inscrire' : 'Se connecter'}
                    </Text>
                </TouchableOpacity>

                {/* Toggle between Sign In and Sign Up using the inverted style */}
                <TouchableOpacity
                    style={ButtonStyles.invertedContainer}
                    onPress={() => {
                        setIsSignup(!isSignup);
                        setError('');
                    }}
                >
                    <Text
                        style={ButtonStyles.invertedText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {isSignup ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Inscription'}
                    </Text>
                </TouchableOpacity>

                {/* "Forgot Password" link styled as simple text */}
                {!isSignup && (
                    <TouchableOpacity
                        style={styles.forgotPasswordButton}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={TextStyles.simpleText}>J'ai oublié mon mot de passe</Text>
                    </TouchableOpacity>
                )}
            </View>
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
    formContainer: {
        width: '80%',
        alignSelf: 'center',
    },
    // Ensure consistent spacing between inputs.
    inputContainer: {
        marginVertical: 0,
        marginBottom: 10,
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    eyeButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    forgotPasswordButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    checklistContainer: {
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
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    validationErrorText: {
        fontSize: 14,
        color: '#FF0000',
        marginTop: 4,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
});

export default AuthScreen;
