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
import { useAuth } from '../../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/NavigationTypes';
import { RouteProp, CommonActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { TextInputStyles } from '../../styles/TextInputStyles';
import { TextStyles } from '../../styles/TextStyles';
import { ButtonStyles } from '../../styles/ButtonStyles';


type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

type Props = {
    navigation: AuthScreenNavigationProp;
    route: AuthScreenRouteProp;
};

const AuthScreen: React.FC<Props> = ({ navigation, route }) => {
    // INITIALISATION : détermine si on est en inscription ou connexion
    const initialMode = route.params?.mode || 'login';
    const [isSignup, setIsSignup] = useState<boolean>(initialMode === 'signup');
    const [email, setEmail] = useState<string>(''); //stocke l'email
    const [displayName, setDisplayName] = useState<string>(''); //pour le nom d'utilisateur
    const [password, setPassword] = useState<string>(''); //stocke le mot de passe
    const [confirmPassword, setConfirmPassword] = useState<string>(''); //confirmation du mot de passe
    const [error, setError] = useState<string>(''); //message d'erreur global
    const [loginAttempts, setLoginAttempts] = useState<number>(0); //compteur des tentatives de connexion
    const { signIn, signUp } = useAuth();

    // ERREURS CHAMPS : stocke les erreurs spécifiques pour chaque champ
    const [emailError, setEmailError] = useState<string>('');
    const [displayNameError, setDisplayNameError] = useState<string>('');
    const [passwordMatchError, setPasswordMatchError] = useState<string>('');

    // VISIBILITÉ MOT DE PASSE : toggle pour afficher ou masquer le mot de passe
    const [showPassword, setShowPassword] = useState<boolean>(false);
    //focus sur le champ mot de passe pour afficher la checklist
    const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
    //référence pour le premier champ de mot de passe
    const passwordRef = useRef<TextInput>(null);

    // ANIMATION : valeurs pour l'opacité de la checklist et la force du mot de passe
    const checklistAnim = useRef(new Animated.Value(0)).current;
    const strengthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(checklistAnim, {
            toValue: passwordFocused || password.length > 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start(); //anime la checklist quand besoin
    }, [passwordFocused, password]);

    //CALCUL FORCE MOT DE PASSE : renvoie la force en pourcentage
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
        }).start(); //anime la barre de force du mot de passe
    }, [password]);

    //INTERPOLATION BARRE : définit la largeur de la barre de force
    const animatedWidth = strengthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    //INTERPOLATION COULEUR : rouge, orange, vert selon la force
    const animatedColor = strengthAnim.interpolate({
        inputRange: [0, 50, 100],
        outputRange: ['#FF0000', '#FFA500', '#00AA00'], // red → orange → green
    });

    //VALIDATION EMAIL : vérifie le format de l'email
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    //VALIDATION MOT DE PASSE : vérifie si le mot de passe respecte les critères
    const validatePassword = (password: string) => {
        const trimmed = password.trim();
        return (
            trimmed.length >= 8 &&
            /[A-Z]/.test(trimmed) &&
            /[0-9]/.test(trimmed) &&
            /[!@#$%^&*_]/.test(trimmed)
        );
    };

    //VALIDATION NOM UTILISATEUR : doit être <=16 caractères, lettres/chiffres/underscore/point
    const validateDisplayName = (name: string) => {
        //Maximum 16 characters; allowed: letters, numbers, underscore, dot.
        const displayNameRegex = /^[A-Za-z0-9_.]{1,16}$/;
        return displayNameRegex.test(name);
    };

    //STOCKAGE TOKEN : sauvegarde le token en mode sécurisé
    const storeToken = async (token: string) => {
        await SecureStore.setItemAsync('userToken', token);
    };

    //AUTHENTIFICATION : gère la connexion ou l'inscription
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

    //GESTION ERREURS : affiche un message sympa en cas d'erreur d'authentification
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
            //redirection vers la confirmation si besoin
            navigation.navigate('ConfirmSignUp', { username: email });
        } else {
            setError(error.message || 'Erreur lors de la connexion.');
        }
    };

    //CHECKLIST : retourne un item de vérification pour le mot de passe
    const renderCheckItem = (condition: boolean, text: string) => (
        <View style={styles.checkItemContainer}>
            <Ionicons
                name={condition ? 'checkmark-circle-outline' : 'close-circle-outline'} //icône ok ou pas ok
                size={16}
                color={condition ? '#00AA00' : '#FF0000'}
                style={styles.checkIcon}
            />
            <Text style={styles.checkText}>{text}</Text>
        </View>
    );

    //DISPONIBILITÉ SOUMISSION : active le bouton si tous les champs sont valides
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
            {/* TITRE PRINCIPAL */}
            <Text style={[TextStyles.title, { marginBottom: 20 }]}>
                {isSignup ? 'Inscription' : 'Connexion'}
            </Text>
            {error ? (
                <Text style={[TextInputStyles.errorText, { textAlign: 'center', marginBottom: 20 }]}>
                    {error}
                </Text>
            ) : null}

            {/* CONTENEUR DU FORMULAIRE */}
            <View style={styles.formContainer}>
                {/*EMAIL INPUT */}
                <View style={[TextInputStyles.container, styles.inputContainer]}>
                    <TextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={text => { setEmail(text); setEmailError(''); }} //maj email et réinitialise erreur
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

                {/*USERNAME INPUT (uniquement pour l'inscription) */}
                {isSignup && (
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            placeholder="Nom d'utilisateur"
                            value={displayName}
                            onChangeText={text => { setDisplayName(text); setDisplayNameError(''); }} //maj du nom et reset erreur
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

                {/*PASSWORD INPUT AVEC ICÔNE */}
                <View style={styles.passwordContainer}>
                    <TextInput
                        ref={passwordRef}
                        placeholder="Mot de passe"
                        value={password}
                        onChangeText={setPassword} //maj du mot de passe
                        style={[TextInputStyles.input, { paddingRight: 40 }]}
                        secureTextEntry={!showPassword} //masque le mot de passe
                        autoComplete="password"
                        onFocus={() => setPasswordFocused(true)} //active la checklist
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
                        onPress={() => setShowPassword(prev => !prev)} //change la visibilité
                        style={styles.eyeButton}
                    >
                        <Ionicons
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={24}
                            color="#b21ae5"
                        />
                    </TouchableOpacity>
                </View>

                {/*CONFIRM PASSWORD INPUT (uniquement pour inscription) */}
                {isSignup && (
                    <View style={[TextInputStyles.container, styles.inputContainer]}>
                        <TextInput
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword} //maj confirmation
                            style={TextInputStyles.input}
                            secureTextEntry={!showPassword}
                            onFocus={() => {
                                if (passwordRef.current) {
                                    passwordRef.current.blur(); //enlève focus sur le premier mot de passe
                                }
                                setPasswordFocused(false); //ferme la checklist
                            }}
                        />
                        {passwordMatchError ? (
                            <Text style={styles.validationErrorText}>{passwordMatchError}</Text>
                        ) : null}
                    </View>
                )}

                {/*CHECKLIST MOT DE PASSE (affichée en inscription si champ focus) */}
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

                {/*BOUTON PRINCIPAL */}
                <TouchableOpacity
                    style={[ButtonStyles.primaryContainer, !canSubmit && { opacity: 0.5 }]}
                    onPress={handleAuth} //lance l'authentif
                    disabled={!canSubmit}
                >
                    <Text style={ButtonStyles.primaryText}>
                        {isSignup ? 'S’inscrire' : 'Se connecter'}
                    </Text>
                </TouchableOpacity>

                {/*BOUTON TOGGLE : bascule entre inscription et connexion */}
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

                {/*LIEN "Forgot Password" (uniquement en mode connexion) */}
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
