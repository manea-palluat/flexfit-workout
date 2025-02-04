// src/screens/ConfirmSignUpScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Auth } from 'aws-amplify';
import { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';

type Props = StackScreenProps<RootStackParamList, 'ConfirmSignUp'>;

const ConfirmSignUpScreen: React.FC<Props> = ({ route, navigation }) => {
    const { username } = route.params;
    const [code, setCode] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [confirmed, setConfirmed] = useState<boolean>(false);

    // src/screens/ConfirmSignUpScreen.tsx
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


    const handleGoToLogin = () => {
        navigation.navigate('Auth', { mode: 'login' });
    };

    if (confirmed) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Confirmation réussie !</Text>
                <Text style={styles.info}>
                    Super ! Vous pouvez maintenant vous connecter !
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
                    <Text style={styles.buttonText}>Connexion</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Confirmez votre inscription</Text>
            <Text style={styles.info}>
                Entrez le code de confirmation envoyé à votre email pour {username}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
                style={styles.input}
                placeholder="Code de confirmation"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
            />
            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                <Text style={styles.buttonText}>Confirmer</Text>
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
        fontWeight: 'bold',
    },
    info: {
        fontSize: 16,
        textAlign: 'center',
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
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
        width: '80%',
    },
});

export default ConfirmSignUpScreen;
