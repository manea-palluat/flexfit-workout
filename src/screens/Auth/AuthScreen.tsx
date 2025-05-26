// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../types/NavigationTypes';
import { FormContainer } from '../../components/form/FormContainer';
import { FormInput } from '../../components/form/FormInput';
import { PasswordInput } from '../../components/form/PasswordInput';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TextStyles } from '../../styles/TextStyles';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

interface Props {
    navigation: AuthScreenNavigationProp;
    route: AuthScreenRouteProp;
}

const AuthScreen: React.FC<Props> = ({ navigation, route }) => {
    const initialMode = route.params?.mode || 'login';
    const [isSignup, setIsSignup] = useState(initialMode === 'signup');

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [displayNameError, setDisplayNameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordMatchError, setPasswordMatchError] = useState('');

    const [loginAttempts, setLoginAttempts] = useState(0);
    const { signIn, signUp } = useAuth();

    const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const validatePassword = (value: string) => {
        const v = value.trim();
        return (
            v.length >= 8 &&
            /[A-Z]/.test(v) &&
            /[0-9]/.test(v) &&
            /[!@#$%^&*_]/.test(v)
        );
    };
    const validateDisplayName = (value: string) => /^[A-Za-z0-9_.]{1,16}$/.test(value);

    const storeToken = async (token: string) => {
        await SecureStore.setItemAsync('userToken', token);
    };

    const handleAuth = async () => {
        setError('');
        setEmailError('');
        setDisplayNameError('');
        setPasswordError('');
        setPasswordMatchError('');

        if (!validateEmail(email)) {
            setEmailError('Email invalide.');
            return;
        }
        if (!validatePassword(password)) {
            setPasswordError(
                'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.'
            );
            return;
        }
        if (isSignup) {
            if (!validateDisplayName(displayName)) {
                setDisplayNameError("Nom d'utilisateur invalide.");
                return;
            }
            if (password !== confirmPassword) {
                setPasswordMatchError('Les mots de passe ne correspondent pas.');
                return;
            }
        }

        try {
            if (isSignup) {
                await signUp(email, password, displayName);
                navigation.navigate('ConfirmSignUp', { username: email });
            } else {
                const token = await signIn(email, password);
                await storeToken(token);
                navigation.dispatch(
                    CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
                );
            }
        } catch (err: any) {
            setLoginAttempts(prev => prev + 1);
            const code = err.code || '';
            if (code === 'UsernameExistsException')
                setError('Cet email est déjà enregistré.');
            else if (code === 'InvalidPasswordException')
                setError('Mot de passe non conforme.');
            else if (code === 'UserNotFoundException')
                setError('Email non reconnu.');
            else if (code === 'NotAuthorizedException')
                setError('Mot de passe incorrect.');
            else if (code === 'UserNotConfirmedException')
                navigation.navigate('ConfirmSignUp', { username: email });
            else setError(err.message || 'Erreur lors de l’authentification.');
        }
    };

    return (
        <View style={styles.screen}>
            <Text style={[TextStyles.title, styles.header]}>
                {isSignup ? 'Inscription' : 'Connexion'}
            </Text>
            <FormContainer>
                {error && <ErrorMessage text={error} />}

                <FormInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    error={emailError}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {isSignup && (
                    <FormInput
                        label="Nom d'utilisateur"
                        value={displayName}
                        onChangeText={setDisplayName}
                        error={displayNameError}
                        autoCapitalize="none"
                    />
                )}

                <PasswordInput
                    label="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    error={passwordError}
                    visible={showPassword}
                    onToggleVisibility={() => setShowPassword(v => !v)}
                    showStrength={isSignup && passwordFocused}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                />

                {isSignup && (
                    <PasswordInput
                        label="Confirmer mot de passe"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        error={passwordMatchError}
                        visible={showPassword}
                        onToggleVisibility={() => setShowPassword(v => !v)}
                        onFocus={() => setPasswordFocused(false)}
                    />
                )}

                <Button title={isSignup ? 'S’inscrire' : 'Se connecter'} onPress={handleAuth} />

                <Button
                    variant="inverted"
                    title={isSignup ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Inscription'}
                    onPress={() => setIsSignup(prev => !prev)}
                />

                {!isSignup && (
                    <Text
                        style={styles.forgotLink}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        J'ai oublié mon mot de passe
                    </Text>
                )}
            </FormContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        alignItems: 'center',
    },
    header: {
        marginBottom: 24,
    },
    forgotLink: {
        width: '100%',
        textAlign: 'center',
        marginTop: 12,
        ...TextStyles.simpleText,
    },
});

export default AuthScreen;
