// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, CommonActions } from '@react-navigation/native';

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
    const { signIn, signUp } = useAuth();

    const handleAuth = async () => {
        setError(''); // Clear previous errors
        if (isSignup) {
            try {
                await signUp(email, password, displayName);
                navigation.navigate('ConfirmSignUp', { username: email });
            } catch (error: any) {
                console.error('Error signing up', error);
                if (error.code === 'UsernameExistsException') {
                    setError("Cet email est déjà enregistré.");
                } else if (error.code === 'InvalidPasswordException') {
                    setError("Le mot de passe ne respecte pas la politique de sécurité : il n'est pas assez long.");
                } else {
                    setError(error.message || 'Erreur lors de l’inscription.');
                }
            }
        } else {
            try {
                await signIn(email, password);
                // Use CommonActions.reset to navigate to MainTabs
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    })
                );
            } catch (error: any) {
                console.error('Error signing in', error);
                if (error.code === 'UserNotFoundException') {
                    setError("L'email n'est pas enregistré.");
                } else if (error.code === 'NotAuthorizedException') {
                    setError('Mot de passe incorrect.');
                } else if (error.code === 'UserNotConfirmedException') {
                    setError("Votre compte n'est pas confirmé. Veuillez vérifier votre email.");
                } else {
                    setError(error.message || 'Erreur lors de la connexion.');
                }
            }
        }
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
            <TextInput
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />
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
            {/* Forgot Password Button */}
            {!isSignup && (
                <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                >
                    <Text style={styles.forgotPasswordText}>J'ai oublié mon mot de passe</Text>
                </TouchableOpacity>
            )}
            {/* Retour Button */}
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
});

export default AuthScreen;
