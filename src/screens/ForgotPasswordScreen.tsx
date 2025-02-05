// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Auth } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    // Step control: step 1 for sending code, step 2 for submitting new password
    const [step, setStep] = useState<number>(1);
    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const sendCode = async () => {
        if (!email) {
            Alert.alert('Erreur', 'Veuillez entrer votre adresse email.');
            return;
        }
        setLoading(true);
        try {
            await Auth.forgotPassword(email);
            Alert.alert('Succès', 'Un code de confirmation a été envoyé à votre email.');
            setStep(2);
        } catch (error) {
            console.error('Erreur lors de l\'envoi du code de réinitialisation:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi du code de réinitialisation.");
        } finally {
            setLoading(false);
        }
    };

    const submitNewPassword = async () => {
        if (!email || !code || !newPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }
        setLoading(true);
        try {
            await Auth.forgotPasswordSubmit(email, code, newPassword);
            Alert.alert('Succès', 'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.');
            navigation.goBack();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de la réinitialisation du mot de passe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Mot de passe oublié</Text>
            {step === 1 && (
                <>
                    <Text style={styles.label}>Entrez votre adresse email :</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <Button title={loading ? 'Envoi en cours...' : "Envoyer le code"} onPress={sendCode} disabled={loading} />
                </>
            )}
            {step === 2 && (
                <>
                    <Text style={styles.label}>Un code vous a été envoyé par email.</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Code de confirmation"
                        keyboardType="numeric"
                        value={code}
                        onChangeText={setCode}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Nouveau mot de passe"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <Button title={loading ? 'Enregistrement...' : 'Valider'} onPress={submitNewPassword} disabled={loading} />
                </>
            )}
            <View style={styles.buttonContainer}>
                <Button title="Retour" onPress={() => navigation.goBack()} color="#888" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff',
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 10,
    },
});

export default ForgotPasswordScreen;
