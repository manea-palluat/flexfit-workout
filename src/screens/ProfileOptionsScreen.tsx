// src/screens/ProfileOptionsScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { deleteExerciseTracking } from '../graphql/mutations'; // Ensure this mutation is defined
import { listExerciseTrackings } from '../graphql/queries';

type ProfileOptionsNavigationProp = StackNavigationProp<RootStackParamList, 'ProfileOptions'>;

const ProfileOptionsScreen: React.FC = () => {
    const navigation = useNavigation<ProfileOptionsNavigationProp>();

    // State for updating the display name.
    const [displayName, setDisplayName] = useState<string>('');
    // State for password change.
    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const handleUpdateProfile = async () => {
        try {
            // Update display name if provided.
            if (displayName.trim().length > 0) {
                const user = await Auth.currentAuthenticatedUser();
                // For example, assume that the display name attribute is stored as 'preferred_username'
                await Auth.updateUserAttributes(user, { preferred_username: displayName });
                Alert.alert('Succès', 'Nom mis à jour.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de la mise à jour du profil.");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        try {
            const user = await Auth.currentAuthenticatedUser();
            await Auth.changePassword(user, oldPassword, newPassword);
            Alert.alert('Succès', 'Mot de passe mis à jour.');
        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors du changement de mot de passe.");
        }
    };

    // Helper function to delete all tracking records for the given user.
    const deleteUserData = async (userId: string) => {
        try {
            let nextToken: string | null = null;
            const allTrackings: any[] = [];
            do {
                const response: any = await API.graphql(
                    graphqlOperation(listExerciseTrackings, {
                        filter: { userId: { eq: userId } },
                        nextToken, // for pagination
                    })
                );
                const { items, nextToken: token } = response.data.listExerciseTrackings;
                console.log(`Fetched ${items.length} tracking records for user ${userId}`);
                allTrackings.push(...items);
                nextToken = token;
            } while (nextToken);

            console.log(`Total tracking records to delete: ${allTrackings.length}`);

            for (const tracking of allTrackings) {
                const input = {
                    id: tracking.id,
                    // Some schemas require the userId or _version field:
                    userId,
                    _version: tracking._version, // Remove or adjust if your schema does not require versioning.
                };
                await API.graphql(graphqlOperation(deleteExerciseTracking, { input }));
                console.log(`Deleted tracking record with id: ${tracking.id}`);
            }
            console.log('All tracking records deleted successfully.');
        } catch (error) {
            console.error('Error deleting tracking exercise data:', error);
            throw error;
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Supprimer le compte",
            "Es-tu sûr de vouloir supprimer ton compte ? Toutes tes données seront effacées.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const user = await Auth.currentAuthenticatedUser();
                            const userId = user.attributes.sub;
                            // Delete all tracking data for the user.
                            await deleteUserData(userId);
                            // Delete the Cognito user account.
                            await Auth.deleteUser();
                            Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès.");
                            navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { mode: 'login' } }] });
                        } catch (error) {
                            console.error("Erreur lors de la suppression du compte:", error);
                            Alert.alert("Erreur", "Une erreur est survenue lors de la suppression du compte.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Options du profil</Text>

            <Text style={styles.sectionTitle}>Modifier le nom</Text>
            <TextInput
                style={styles.input}
                placeholder="Nouveau nom d'utilisateur"
                value={displayName}
                onChangeText={setDisplayName}
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
                <Text style={styles.buttonText}>Mettre à jour le nom</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
            <TextInput
                style={styles.input}
                placeholder="Ancien mot de passe"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirmer le nouveau mot de passe"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                <Text style={styles.buttonText}>Changer le mot de passe</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Supprimer le compte</Text>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
                <Text style={styles.buttonText}>Supprimer mon compte</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelButtonText}>Retour</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: 40, // Extra top padding so the header isn't stuck to the very top.
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        width: '90%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007BFF',
        width: '90%',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    deleteButton: {
        backgroundColor: '#DC3545',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        marginTop: 30,
        width: '90%',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#6C757D',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ProfileOptionsScreen;
