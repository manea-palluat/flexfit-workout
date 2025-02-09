// src/screens/ConfirmSignUpScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import { Auth } from 'aws-amplify';
import { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';
import { TextInputStyles } from '../styles/TextInputStyles';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextStyles } from '../styles/TextStyles';

type Props = StackScreenProps<RootStackParamList, 'ConfirmSignUp'>;

const ConfirmSignUpScreen: React.FC<Props> = ({ route, navigation }) => {
    const { username } = route.params;
    const [code, setCode] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [confirmed, setConfirmed] = useState<boolean>(false);

    // Timer state for the "Renvoyer le code" button (in seconds)
    const [resendTimer, setResendTimer] = useState<number>(0);

    // Countdown effect: decrease the timer every second when active.
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    const handleConfirm = async () => {
        setError('');
        try {
            await Auth.confirmSignUp(username, code);
            setConfirmed(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'CodeMismatchException') {
                setError("Code de vérification invalide, veuillez réessayer.");
            } else if (err.code === 'ExpiredCodeException') {
                setError("Le code a expiré. Veuillez demander un nouveau code.");
            } else {
                setError(err.message || 'Erreur lors de la confirmation.');
            }
        }
    };

    const handleResendCode = async () => {
        setError('');
        try {
            await Auth.resendSignUp(username);
            setResendTimer(60); // Disable resend for 60 seconds
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erreur lors de l’envoi du nouveau code.");
        }
    };

    const handleGoToLogin = () => {
        navigation.navigate('Auth', { mode: 'login' });
    };

    if (confirmed) {
        return (
            <View style={styles.container}>
                <Text style={[TextStyles.title, { marginBottom: 20 }]}>
                    Confirmation réussie !
                </Text>
                <Text style={[TextStyles.simpleText, styles.info]}>
                    Super ! Vous pouvez maintenant vous connecter.
                </Text>
                <TouchableOpacity style={[ButtonStyles.container, styles.fullWidth]} onPress={handleGoToLogin}>
                    <Text style={ButtonStyles.text}>Connexion</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[TextStyles.title, { marginBottom: 20 }]}>
                Confirmez votre inscription
            </Text>
            <Text style={[TextStyles.simpleText, styles.info]}>
                Entrez le code de confirmation envoyé à votre email pour {username}
            </Text>
            {error ? (
                <Text style={[TextInputStyles.errorText, styles.error]}>
                    {error}
                </Text>
            ) : null}
            <View style={[TextInputStyles.container, styles.inputContainer]}>
                <TextInput
                    style={TextInputStyles.input}
                    placeholder="Code de confirmation"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                />
            </View>
            <TouchableOpacity
                style={[
                    ButtonStyles.container,
                    styles.fullWidth,
                    code.trim().length !== 6 && { opacity: 0.5 }
                ]}
                onPress={handleConfirm}
                disabled={code.trim().length !== 6}
            >
                <Text style={ButtonStyles.text}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    ButtonStyles.invertedContainer,
                    styles.fullWidth,
                    resendTimer > 0 && { opacity: 0.5 }
                ]}
                onPress={handleResendCode}
                disabled={resendTimer > 0}
            >
                <Text style={ButtonStyles.invertedText}>
                    {resendTimer > 0 ? `Renvoyer le code (${resendTimer})` : 'Renvoyer le code'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        ...TextStyles.simpleText,
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 16,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 10,
    },
    error: {
        marginBottom: 20,
        textAlign: 'center',
        width: '100%',
    },
    // Use full width relative to the form container (which is set to 80% of the screen)
    fullWidth: {
        width: '100%',
        alignSelf: 'center',
        marginBottom: 10,
    },
});

export default ConfirmSignUpScreen;
