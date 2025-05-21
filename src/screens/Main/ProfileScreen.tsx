import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Auth } from 'aws-amplify';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/NavigationTypes';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ButtonStyles } from '../../styles/ButtonStyles';
import { TextStyles } from '../../styles/TextStyles';

type ScreenWithoutParams =
    { [K in keyof RootStackParamList]:
        undefined extends RootStackParamList[K] ? K : never
    }[keyof RootStackParamList]

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const ProfileScreen: React.FC = () => {
    const { user, signOut } = useAuth(); // récupère l'user et la fonction de déconnexion
    const navigation = useNavigation<NavigationProp>(); // navigation pour passer d'écran en écran
    const [currentUser, setCurrentUser] = useState(user); // stocke l'utilisateur actuel

    // REFRESH USER: on recharge l'utilisateur à chaque focus de l'écran
    useFocusEffect(
        useCallback(() => {
            const refreshUser = async () => {
                try {
                    const updatedUser = await Auth.currentAuthenticatedUser();
                    setCurrentUser(updatedUser);
                } catch (error: any) {
                    if (!error.message || !error.message.toLowerCase().includes('not authenticated')) {
                        console.error('Error refreshing user:', error);
                    }
                    setCurrentUser(null);
                }
            };
            refreshUser();
        }, [])
    );

    if (!currentUser) {
        return (
            <View style={styles.container}>
                {/* TITRE */}
                {/*{/* Affiche le titre et invite l'utilisateur à se connecter */}
                <Text style={[TextStyles.title, { marginBottom: 20 }]}>Profil</Text>
                <Text style={TextStyles.subSimpleText}>Vous n'êtes pas connecté.</Text>
                <TouchableOpacity
                    style={ButtonStyles.primaryContainer}
                    onPress={() => navigation.navigate('Auth', { mode: 'login' })}
                >
                    <Text style={ButtonStyles.primaryText}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={ButtonStyles.primaryContainer}
                    onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
                >
                    <Text style={ButtonStyles.primaryText}>Inscription</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const displayName = currentUser.attributes.preferred_username || 'Utilisateur'; // nom à afficher
    const email = currentUser.attributes.email || 'Email non défini'; // email à afficher

    // MENU OPTIONS: définit les options du menu avec leurs icônes

    /* Ancienne version
    const menuOptions: MenuOption[] = [
        { label: 'Confidentialité', route: 'PrivacyPolicy', icon: 'lock-closed-outline' },
        //{ label: 'Historique d’achats', route: 'PurchaseHistory', icon: 'receipt-outline' },
        //{ label: 'Aide & Support', route: 'HelpSupport', icon: 'help-circle-outline' },
        { label: 'Paramètres', route: 'ParameterScreen', icon: 'settings-outline' },
        { label: 'Options du profil', route: 'ProfileOptions', icon: 'person-circle-outline' },
        //{ label: 'Inviter un ami', route: 'InviteFriend', icon: 'person-add-outline' },
        { label: 'Déconnexion', action: 'logout', icon: 'log-out-outline' },
    ]; */

    const menuOptions: MenuOption[] = [
        { label: 'Confidentialité', route: 'PrivacyPolicy', icon: 'lock-closed-outline' },
        { label: 'Paramètres', route: 'ParameterScreen', icon: 'settings-outline' },
        { label: 'Options du profil', route: 'ProfileOptions', icon: 'person-circle-outline' },
        { label: 'Déconnexion', action: 'logout', icon: 'log-out-outline' },
    ]


    // HANDLER MENU: gère l'action quand on appuie sur une option
    const handleMenuPress = (option: MenuOption) => {
        if (option.action === 'logout') {
            signOut().catch((error) => console.error('Error signing out:', error));
        } else if (option.route) {
            try {
                navigation.navigate(option.route);
            } catch (error) {
                Alert.alert('Info', `La page "${option.label}" n'est pas encore disponible.`);
            }
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* PROFILE SECTION */}
            {/*{/* Affiche la section profil avec image, nom et email */}
            <View style={styles.profileSection}>
                <Image
                    style={styles.profileImage}
                    source={require('../../../assets/axolotl.png')}
                />
                <Text style={[TextStyles.title, { marginTop: 16 }]}>{displayName}</Text>
                <Text style={[TextStyles.subSimpleText, { marginTop: 8 }]}>{email}</Text>
            </View>

            {/* UPGRADE TO PRO BUTTON */}
            {/*{/* Bouton pour passer en Premium, fonctionnalité à venir */}
            <TouchableOpacity
                style={[ButtonStyles.primaryContainer, styles.proButton]}
                onPress={() => Alert.alert('Premium', 'Les fonctionnalités Premium viendront bientôt ! #Richesse #Standing #PremièreClasse')}
            >
                <Text style={ButtonStyles.primaryText}>Passer en Premium</Text>
            </TouchableOpacity>

            {/* MENU LIST */}
            {/*{/* Liste des options du menu */}
            <View style={styles.menuContainer}>
                {menuOptions.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(option)}
                    >
                        <Ionicons
                            name={option.icon}
                            size={24}
                            color="#b21ae5"
                            style={styles.menuIcon}
                        />
                        <Text style={styles.menuText}>{option.label}</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color="#b21ae5"
                            style={styles.menuArrow}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

// TYPE DU MENU OPTION
interface MenuOption {
    label: string;
    route?: ScreenWithoutParams;
    action?: 'logout';
    icon: IconName;
}


// TYPES DES ICÔNES AUTORISÉES
type IconName =
    | "lock-closed-outline"
    | "receipt-outline"
    | "help-circle-outline"
    | "settings-outline"
    | "person-add-outline"
    | "log-out-outline"
    | "person-circle-outline";

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    profileSection: {
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
    proButton: {
        marginVertical: 20,
    },
    menuContainer: {
        width: '100%',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F0F5',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginVertical: 8,
    },
    menuIcon: {
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    menuArrow: {
        marginLeft: 8,
    },
});

export default ProfileScreen;
