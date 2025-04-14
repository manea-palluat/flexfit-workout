import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    Animated,
} from 'react-native';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { deleteExerciseTracking } from '../graphql/mutations';
import { listExerciseTrackings } from '../graphql/queries';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextInputStyles } from '../styles/TextInputStyles';
import { TextStyles } from '../styles/TextStyles';

type ProfileOptionsNavigationProp = StackNavigationProp<RootStackParamList, 'ProfileOptions'>;

const ProfileOptionsScreen: React.FC = () => {
    const navigation = useNavigation<ProfileOptionsNavigationProp>(); // récupère la navigation

    // MODIFICATION DU NOM : état pour le nouveau nom
    const [displayName, setDisplayName] = useState<string>(''); //nom à mettre à jour
    // CHANGEMENT DU MOT DE PASSE : états pour l'ancien, nouveau, et confirmation
    const [oldPassword, setOldPassword] = useState<string>(''); //ancien mdp
    const [newPassword, setNewPassword] = useState<string>(''); //nouveau mdp
    const [confirmPassword, setConfirmPassword] = useState<string>(''); //confirmation mdp
    const [passwordError, setPasswordError] = useState<string>(''); // erreur sur le nouveau mdp
    const [confirmError, setConfirmError] = useState<string>(''); // erreur de confirmation

    // ANIMATION FORCE MDP : création de la barre animée pour la force du mdp
    const strengthAnim = useRef(new Animated.Value(0)).current;
    const animatedWidth = strengthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    }); // largeur de la barre selon la force
    const animatedColor = strengthAnim.interpolate({
        inputRange: [0, 50, 100],
        outputRange: ['#FF0000', '#FFA500', '#b21ae5'], // rouge → orange → violet
    }); // couleur change en fonction de la force

    // IMAGE DE PROFIL : utilisation d'une image axolotl pour le profil
    const profileImage = require('../../assets/axolotl.png'); // image du profil

    // VALIDATION DU MOT DE PASSE : vérifie que le mdp respecte les critères
    const validatePassword = (pwd: string): boolean => {
        const trimmed = pwd.trim();
        return (
            trimmed.length >= 8 &&
            /[A-Z]/.test(trimmed) &&
            /[0-9]/.test(trimmed) &&
            /[!@#$%^&*_]/.test(trimmed)
        );
    };

    useEffect(() => {
        // Calcule la force du mdp: si valide, force = 100, sinon proportionnelle à la longueur
        const strength = validatePassword(newPassword) ? 100 : (newPassword.trim().length / 8) * 100;
        Animated.spring(strengthAnim, {
            toValue: strength,
            friction: 6,
            tension: 80,
            useNativeDriver: false,
        }).start(); // lance l'animation de la barre de force
    }, [newPassword]);

    // Activation du bouton "Changer le mot de passe" seulement si tout est OK
    const canChangePassword =
        oldPassword.trim() !== '' &&
        newPassword.trim() !== '' &&
        validatePassword(newPassword) &&
        newPassword === confirmPassword; // tous les critères doivent être remplis

    // CHECKLIST : rend un item de vérification pour la force du mdp
    const renderCheckItem = (condition: boolean, text: string) => (
        <View style={styles.checkItemContainer}>
            <Ionicons
                name={condition ? 'checkmark-circle-outline' : 'close-circle-outline'} // icône selon le résultat
                size={16}
                color={condition ? '#00AA00' : '#FF0000'}
                style={styles.checkIcon}
            />
            <Text style={styles.checkText}>{text}</Text>
        </View>
    );

    // MISE À JOUR DU PROFIL : update du nom via Auth
    const handleUpdateProfile = async () => {
        try {
            if (displayName.trim().length > 0) {
                const user = await Auth.currentAuthenticatedUser();
                await Auth.updateUserAttributes(user, { preferred_username: displayName });
                Alert.alert('Succès', 'Nom mis à jour.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de la mise à jour du profil.");
        }
    };

    // CHANGEMENT DU MOT DE PASSE : appelle Auth.changePassword avec les valeurs saisies
    const handleChangePassword = async () => {
        if (!canChangePassword) {
            Alert.alert('Erreur', 'Vérifiez que le nouveau mot de passe est valide et correspond à sa confirmation.');
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

    // SUPPRESSION DES DONNÉES : supprime toutes les données de suivi de l'utilisateur
    const deleteUserData = async (userId: string) => {
        try {
            let nextToken: string | null = null;
            const allTrackings: any[] = [];
            do {
                const response: any = await API.graphql(
                    graphqlOperation(listExerciseTrackings, {
                        filter: { userId: { eq: userId } },
                        nextToken,
                    })
                );
                const { items, nextToken: token } = response.data.listExerciseTrackings;
                console.log(`Fetched ${items.length} tracking records for user ${userId}`); // log du nombre d'enregistrements
                allTrackings.push(...items);
                nextToken = token;
            } while (nextToken);

            console.log(`Total tracking records to delete: ${allTrackings.length}`);
            for (const tracking of allTrackings) {
                const input = {
                    id: tracking.id,
                    userId,
                    _version: tracking._version,
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

    // SUPPRESSION DU COMPTE : demande confirmation puis supprime toutes les données et le compte
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
                            await deleteUserData(userId);
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
            {/* PROFILE HEADER */}
            <View style={styles.profileHeader}>
                <Image source={profileImage} style={styles.profileImage} />{/*affiche la photo de profil*/}
                <Text style={[TextStyles.title, { marginTop: 16 }]}>Options du profil</Text>
            </View>

            {/* CARD: MODIFIER LE NOM */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-outline" size={20} color="#b21ae5" style={styles.cardIcon} />{/*icône de profil*/}
                    <Text style={styles.cardTitle}>Modifier le nom</Text>
                </View>
                <TextInput
                    style={[TextInputStyles.input, styles.inputSpacing]}
                    placeholder="Nouveau nom d'utilisateur"
                    value={displayName}
                    onChangeText={setDisplayName} //maj du nom
                />
                <TouchableOpacity style={[ButtonStyles.container, styles.cardButton]} onPress={handleUpdateProfile}>
                    <Text style={ButtonStyles.text}>Mettre à jour le nom</Text>
                </TouchableOpacity>
            </View>

            {/* CARD: CHANGER LE MOT DE PASSE */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="key-outline" size={20} color="#b21ae5" style={styles.cardIcon} />{/*icône clé*/}
                    <Text style={styles.cardTitle}>Changer le mot de passe</Text>
                </View>
                <View style={styles.inputGroup}>
                    <TextInput
                        style={[TextInputStyles.input, styles.inputSpacing]}
                        placeholder="Ancien mot de passe"
                        secureTextEntry
                        value={oldPassword}
                        onChangeText={setOldPassword} //maj ancien mdp
                    />
                    <TextInput
                        style={[TextInputStyles.input, styles.inputSpacing]}
                        placeholder="Nouveau mot de passe"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={(text) => {
                            setNewPassword(text); //maj nouveau mdp
                            if (!validatePassword(text)) {
                                setPasswordError(
                                    'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.'
                                );
                            } else {
                                setPasswordError('');
                            }
                        }}
                    />
                    {/* ANIMATION BARRE ET CHECKLIST */}
                    {newPassword.length > 0 && (
                        <Animated.View style={styles.checklistContainer}>
                            <View style={styles.progressContainer}>
                                <Animated.View
                                    style={[
                                        styles.progressBar,
                                        { width: animatedWidth, backgroundColor: animatedColor },
                                    ]}
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
                    <TextInput
                        style={[TextInputStyles.input, styles.inputSpacing]}
                        placeholder="Confirmer le nouveau mot de passe"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text); //maj confirmation
                            if (newPassword !== text) {
                                setConfirmError('Les mots de passe ne correspondent pas.');
                            } else {
                                setConfirmError('');
                            }
                        }}
                    />
                    {passwordError ? (
                        <Text style={styles.validationErrorText}>{passwordError}</Text>
                    ) : null}
                    {confirmError ? (
                        <Text style={styles.validationErrorText}>{confirmError}</Text>
                    ) : null}
                </View>
                <TouchableOpacity
                    style={[
                        ButtonStyles.container,
                        styles.cardButton,
                        !canChangePassword && { opacity: 0.5 },
                    ]}
                    onPress={handleChangePassword}
                    disabled={!canChangePassword}
                >
                    <Text style={ButtonStyles.text}>Changer le mot de passe</Text>
                </TouchableOpacity>
            </View>

            {/* CARD: SUPPRIMER LE COMPTE */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="trash-outline" size={20} color="#b21ae5" style={styles.cardIcon} />{/*icône poubelle*/}
                    <Text style={[styles.cardTitle, { color: '#b21ae5' }]}>Supprimer le compte</Text>
                </View>
                <TouchableOpacity
                    style={[ButtonStyles.container, styles.cardButton, styles.deleteButton]}
                    onPress={handleDeleteAccount}
                >
                    <Text style={ButtonStyles.text}>Supprimer mon compte</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#b21ae5',
        resizeMode: 'cover',
        alignSelf: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardIcon: {
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    inputGroup: {
        marginBottom: 10,
    },
    inputSpacing: {
        marginBottom: 10,
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
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    checklist: {
        // rien de spécial ici
    },
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
    cardButton: {
        marginTop: 10,
    },
    deleteButton: {
        backgroundColor: '#DC3545',
    },
    validationErrorText: {
        color: '#FF0000',
        fontSize: 14,
        marginBottom: 10,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
});

export default ProfileOptionsScreen;
