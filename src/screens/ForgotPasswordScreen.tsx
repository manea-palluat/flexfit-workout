// src/screens/ForgotPasswordScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    StyleSheet,
    Animated
} from 'react-native';
import { Auth } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';
import { Ionicons } from '@expo/vector-icons';

import { TextInputStyles } from '../styles/TextInputStyles';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextStyles } from '../styles/TextStyles';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    // Step control: step 1 for sending code, step 2 for submitting new password
    const [step, setStep] = useState<number>(1);
    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // For new password strength checker
    const [newPasswordFocused, setNewPasswordFocused] = useState<boolean>(false);
    const checklistAnim = useRef(new Animated.Value(0)).current;
    const strengthAnim = useRef(new Animated.Value(0)).current;

    // Animate checklist opacity when new password field is focused or non-empty
    useEffect(() => {
        Animated.timing(checklistAnim, {
            toValue: newPasswordFocused || newPassword.length > 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [newPasswordFocused, newPassword]);

    // Compute password strength (as a percentage) – same as in AuthScreen
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
        const strength = computePasswordStrength(newPassword);
        Animated.spring(strengthAnim, {
            toValue: strength,
            friction: 6,
            tension: 80,
            useNativeDriver: false,
        }).start();
    }, [newPassword]);

    const animatedWidth = strengthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    const animatedColor = strengthAnim.interpolate({
        inputRange: [0, 50, 100],
        outputRange: ['#FF0000', '#FFA500', '#00AA00'],
    });

    // Simple email format validator
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Validate that the confirmation code is exactly 6 digits
    const validateCode = (code: string): boolean => {
        const codeRegex = /^\d{6}$/;
        return codeRegex.test(code);
    };

    // Error handling with friendly French messages
    const handleForgotPasswordErrors = (error: any) => {
        console.error('Forgot Password Error:', error);
        if (error.code === 'UserNotFoundException') {
            setError("L'email n'est pas enregistré.");
        } else if (error.code === 'CodeMismatchException') {
            setError("Le code de vérification est invalide, veuillez réessayer.");
        } else if (error.code === 'ExpiredCodeException') {
            setError("Le code de vérification a expiré, veuillez en demander un nouveau.");
        } else if (
            error.code === 'InvalidParameterException' &&
            error.message &&
            error.message.includes('password')
        ) {
            setError(
                "Le mot de passe est invalide. Veuillez vérifier qu'il ne commence ni ne se termine par un espace et qu'il respecte les critères de sécurité."
            );
        } else {
            setError(error.message || 'Erreur lors de la réinitialisation du mot de passe.');
        }
    };

    const sendCode = async () => {
        setError(''); // Clear previous error
        if (!email) {
            setError('Veuillez entrer votre adresse email.');
            return;
        }
        if (!validateEmail(email)) {
            setError("L'adresse email n'est pas valide.");
            return;
        }
        setLoading(true);
        try {
            await Auth.forgotPassword(email);
            Alert.alert('Succès', 'Un code de confirmation a été envoyé à votre email.');
            setStep(2);
        } catch (err) {
            handleForgotPasswordErrors(err);
        } finally {
            setLoading(false);
        }
    };

    const submitNewPassword = async () => {
        setError(''); // Clear previous error
        if (!email || !code || !newPassword) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        if (!validateCode(code)) {
            setError('Le code de confirmation doit comporter 6 chiffres.');
            return;
        }
        if (!computePasswordStrength(newPassword)) {
            setError('Le nouveau mot de passe ne respecte pas les critères de sécurité.');
            return;
        }
        setLoading(true);
        try {
            await Auth.forgotPasswordSubmit(email, code, newPassword);
            Alert.alert('Succès', 'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.');
            navigation.goBack();
        } catch (err) {
            handleForgotPasswordErrors(err);
        } finally {
            setLoading(false);
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

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Header Title */}
            <Text style={[TextStyles.title, { marginBottom: 20, textAlign: 'center' }]}>
                Mot de passe oublié
            </Text>

            {/* Error Message */}
            {error ? (
                <Text style={[TextInputStyles.errorText, { textAlign: 'center', marginBottom: 20 }]}>
                    {error}
                </Text>
            ) : null}

            {step === 1 && (
                <View style={styles.formContainer}>
                    <Text style={[TextStyles.headerText, styles.label]}>
                        Entrez votre adresse email :
                    </Text>
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            style={TextInputStyles.input}
                            placeholder="Email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <TouchableOpacity style={ButtonStyles.container} onPress={sendCode} disabled={loading}>
                        <Text style={ButtonStyles.text}>
                            {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === 2 && (
                <View style={styles.formContainer}>
                    <Text style={[TextStyles.headerText, styles.label]}>
                        Un code vous a été envoyé par email.
                    </Text>
                    {/* Confirmation Code Input */}
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            style={TextInputStyles.input}
                            placeholder="Code de confirmation"
                            keyboardType="numeric"
                            value={code}
                            onChangeText={setCode}
                        />
                    </View>
                    {/* New Password Input */}
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            style={[TextInputStyles.input, { paddingRight: 40 }]}
                            placeholder="Nouveau mot de passe"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            onFocus={() => setNewPasswordFocused(true)}
                            onBlur={() => setNewPasswordFocused(false)}
                        />
                    </View>
                    {/* Password Strength Checker & Checklist */}
                    {(newPasswordFocused || newPassword.length > 0) && (
                        <Animated.View style={[styles.checklistContainer, { opacity: checklistAnim }]}>
                            <View style={styles.progressContainer}>
                                <Animated.View
                                    style={[styles.progressBar, { width: animatedWidth, backgroundColor: animatedColor }]}
                                />
                            </View>
                            <View style={styles.checklist}>
                                {renderCheckItem(newPassword.trim().length >= 8, 'Au moins 8 caractères')}
                                {renderCheckItem(/[A-Z]/.test(newPassword.trim()), 'Au moins une majuscule')}
                                {renderCheckItem(/[0-9]/.test(newPassword.trim()), 'Au moins un chiffre')}
                                {renderCheckItem(/[!@#$%^&*_]/.test(newPassword.trim()), 'Au moins un caractère spécial')}
                            </View>
                        </Animated.View>
                    )}
                    <TouchableOpacity style={ButtonStyles.container} onPress={submitNewPassword} disabled={loading}>
                        <Text style={ButtonStyles.text}>
                            {loading ? 'Enregistrement...' : 'Valider'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* "Retour" button has been removed as it's unnecessary with the header */}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        width: '80%',
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        width: '100%',
        textAlign: 'left',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    // Checklist & progress bar styles (inspired by AuthScreen)
    checklistContainer: {
        width: '100%',
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
});

export default ForgotPasswordScreen;
