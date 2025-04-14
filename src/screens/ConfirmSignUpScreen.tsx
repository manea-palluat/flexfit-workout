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
    // INITIALISATION : récupère le username passé en paramètre
    const { username } = route.params;
    const [code, setCode] = useState<string>(''); //stocke le code saisi
    const [error, setError] = useState<string>(''); //pour les messages d'erreur
    const [confirmed, setConfirmed] = useState<boolean>(false); //indique si la confirmation a réussi

    // TIMER : pour désactiver "Renvoyer le code" pendant quelques secondes
    const [resendTimer, setResendTimer] = useState<number>(0);

    //COMPTE À REBOURS : décrémente le timer chaque seconde quand il est actif
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

    //CONFIRMATION : essaie de confirmer l'inscription avec le code
    const handleConfirm = async () => {
        setError('');
        try {
            await Auth.confirmSignUp(username, code);
            setConfirmed(true); // confirmation réussie
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

    //RENVOI CODE : envoie à nouveau le code de confirmation et démarre le timer
    const handleResendCode = async () => {
        setError('');
        try {
            await Auth.resendSignUp(username);
            setResendTimer(60); //désactive le bouton pendant 60 sec
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erreur lors de l’envoi du nouveau code.");
        }
    };

    //RETOUR LOGIN : redirige vers l'écran de connexion
    const handleGoToLogin = () => {
        navigation.navigate('Auth', { mode: 'login' });
    };

    //SI CONFIRMÉ : affiche un écran de succès
    if (confirmed) {
        return (
            <View style={styles.container}>
                {/* TITRE SUCCESS */}
                {/*{/* Titre de confirmation */}
                <Text style={[TextStyles.title, { marginBottom: 20 }]}>
                    Confirmation réussie !
                </Text>
                {/*Message info*/}
                <Text style={[TextStyles.simpleText, styles.info]}>
                    Super ! Vous pouvez maintenant vous connecter.
                </Text>
                {/*Bouton pour aller se connecter*/}
                <TouchableOpacity style={[ButtonStyles.container, styles.fullWidth]} onPress={handleGoToLogin}>
                    <Text style={ButtonStyles.text}>Connexion</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ECRAN DE CONFIRMATION : demande le code de vérification à l'utilisateur
    return (
        <View style={styles.container}>
            {/* TITRE PRINCIPAL */}
            {/*{/* Affiche le titre de l'écran */}
            <Text style={[TextStyles.title, { marginBottom: 20 }]}>
                Confirmez votre inscription
            </Text>
            {/* INFO TEXT : indique à qui le code a été envoyé */}
            <Text style={[TextStyles.simpleText, styles.info]}>
                Entrez le code de confirmation envoyé à votre email pour {username}
            </Text>
            {error ? (
                <Text style={[TextInputStyles.errorText, styles.error]}>
                    {error}
                </Text>
            ) : null}
            {/* INPUT CODE : zone de saisie du code */}
            <View style={[TextInputStyles.container, styles.inputContainer]}>
                <TextInput
                    style={TextInputStyles.input}
                    placeholder="Code de confirmation"
                    value={code}
                    onChangeText={setCode} //maj du code
                    keyboardType="numeric"
                />
            </View>
            {/* BOUTON CONFIRMER */}
            <TouchableOpacity
                style={[
                    ButtonStyles.container,
                    styles.fullWidth,
                    code.trim().length !== 6 && { opacity: 0.5 } //désactive si code incomplet
                ]}
                onPress={handleConfirm}
                disabled={code.trim().length !== 6}
            >
                <Text style={ButtonStyles.text}>Confirmer</Text>
            </TouchableOpacity>
            {/* BOUTON RENVOYER CODE */}
            <TouchableOpacity
                style={[
                    ButtonStyles.invertedContainer,
                    styles.fullWidth,
                    resendTimer > 0 && { opacity: 0.5 } //désactive si timer actif
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
    fullWidth: {
        width: '100%',
        alignSelf: 'center',
        marginBottom: 10,
    },
});

export default ConfirmSignUpScreen;
