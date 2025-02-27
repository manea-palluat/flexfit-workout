// src/screens/ProfileOptionsScreen.tsx
// IMPORTS : on charge React, ses hooks, et les modules de base (Auth, API, navigation, etc.)
import React, { useState } from 'react'; // importe react et useState pour gérer les states
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'; // composants RN basiques
import { Auth, API, graphqlOperation } from 'aws-amplify'; // pour les opérations d'auth et API
import { useNavigation } from '@react-navigation/native'; // navigation entre écrans
import type { RootStackParamList } from '../types/NavigationTypes'; // types pour la navigation
import { StackNavigationProp } from '@react-navigation/stack'; // typage pour la stack navigation
import { deleteExerciseTracking } from '../graphql/mutations'; // mutation pour supprimer un suivi (à définir)
import { listExerciseTrackings } from '../graphql/queries'; // requête pour lister les suivis

type ProfileOptionsNavigationProp = StackNavigationProp<RootStackParamList, 'ProfileOptions'>; // typage pour ce screen

// PROFILE OPTIONS SCREEN : options de modification du profil, changement de mot de passe, et suppression du compte
const ProfileOptionsScreen: React.FC = () => {
    const navigation = useNavigation<ProfileOptionsNavigationProp>(); // navigation typée

    // ETATS : pour mettre à jour le nom affiché
    const [displayName, setDisplayName] = useState<string>(''); // state pour nouveau pseudo
    // ETATS : pour changer le mot de passe
    const [oldPassword, setOldPassword] = useState<string>(''); // ancien mot de passe
    const [newPassword, setNewPassword] = useState<string>(''); // nouveau mot de passe
    const [confirmPassword, setConfirmPassword] = useState<string>(''); // confirmation du nouveau mot de passe

    // FONCTION : MAJ DU NOM D'AFFICHAGE
    const handleUpdateProfile = async () => {
        try {
            // on vérifie si un nouveau nom est saisi
            if (displayName.trim().length > 0) {
                const user = await Auth.currentAuthenticatedUser(); // récupère l'user courant
                // On suppose que le pseudo est stocké dans 'preferred_username'
                await Auth.updateUserAttributes(user, { preferred_username: displayName });
                Alert.alert('Succès', 'Nom mis à jour.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de la mise à jour du profil.");
        }
    };

    // FONCTION : CHANGEMENT DE MOT DE PASSE
    const handleChangePassword = async () => {
        // si les deux nouveaux mdp ne correspondent pas
        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        try {
            const user = await Auth.currentAuthenticatedUser(); // récupère l'user
            await Auth.changePassword(user, oldPassword, newPassword); // change le mdp
            Alert.alert('Succès', 'Mot de passe mis à jour.');
        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors du changement de mot de passe.");
        }
    };

    // FONCTION : SUPPRESSION DES DONNÉES DE SUIVI DE L'USER
    const deleteUserData = async (userId: string) => {
        try {
            let nextToken: string | null = null;
            const allTrackings: any[] = [];
            // BOUCLE POUR LA PAGINATION : récupère tous les suivis de l'user
            do {
                const response: any = await API.graphql(
                    graphqlOperation(listExerciseTrackings, {
                        filter: { userId: { eq: userId } },
                        nextToken, // pagination
                    })
                );
                const { items, nextToken: token } = response.data.listExerciseTrackings;
                console.log(`Fetched ${items.length} tracking records for user ${userId}`);
                allTrackings.push(...items);
                nextToken = token;
            } while (nextToken);

            console.log(`Total tracking records to delete: ${allTrackings.length}`);

            // Suppression de chaque suivi
            for (const tracking of allTrackings) {
                const input = {
                    id: tracking.id, // id du suivi
                    userId, // requis dans certains schémas
                    _version: tracking._version, // version, à ajuster si non utilisé
                };
                await API.graphql(graphqlOperation(deleteExerciseTracking, { input }));
                console.log(`Deleted tracking record with id: ${tracking.id}`);
            }
            console.log('All tracking records deleted successfully.');
        } catch (error) {
            console.error('Error deleting tracking exercise data:', error);
            throw error; // relance l'erreur
        }
    };

    // FONCTION : SUPPRESSION DU COMPTE
    const handleDeleteAccount = async () => {
        Alert.alert(
            "Supprimer le compte", // TITRE
            "Es-tu sûr de vouloir supprimer ton compte ? Toutes tes données seront effacées.", // MESSAGE
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const user = await Auth.currentAuthenticatedUser(); // récupère l'user
                            const userId = user.attributes.sub; // identifiant de l'user
                            // Suppression de toutes les données de suivi
                            await deleteUserData(userId);
                            // Suppression du compte Cognito
                            await Auth.deleteUser();
                            Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès.");
                            // RESET DE LA NAVIGATION : redirige vers l'écran de connexion
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

    // RENDER : AFFICHAGE DES OPTIONS DU PROFIL
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Options du profil</Text>

            <Text style={styles.sectionTitle}>Modifier le nom</Text>
            <TextInput
                style={styles.input}
                placeholder="Nouveau nom d'utilisateur" // placeholder
                value={displayName}
                onChangeText={setDisplayName} // update le state
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
        padding: 20, // padding global
        backgroundColor: '#fff', // fond blanc
        flexGrow: 1,
        alignItems: 'center', // centre horizontalement
        paddingTop: 40, // pour que le header ne colle pas en haut
    },
    header: {
        fontSize: 28, // TITRE PRINCIPAL
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20, // TITRE DE SECTION
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        width: '90%', // largeur relative
        borderWidth: 1, // bordure simple
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12, // padding interne
        marginBottom: 20,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007BFF', // bleu pour bouton
        width: '90%',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    deleteButton: {
        backgroundColor: '#DC3545', // rouge pour supprimer
    },
    buttonText: {
        color: '#fff', // texte en blanc
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        marginTop: 30,
        width: '90%',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#6C757D', // gris pour annuler
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ProfileOptionsScreen;
