import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>; //définit le type de navigation pour "MainTabs"

interface NotLoggedInModalProps {
    visible: boolean; //booléen pour afficher ou non la modale
    onClose: () => void; //callback pour fermer la modale
}

const NotLoggedInModal: React.FC<NotLoggedInModalProps> = ({ visible, onClose }) => {
    const navigation = useNavigation<NavigationProp>(); //obtient l'objet de navigation

    const handleLoginNavigation = () => {
        onClose(); //ferme la modale
        navigation.navigate('Auth', { mode: 'login' }); //redirige vers l'écran d'authentification en mode connexion
    };

    const handleSignupNavigation = () => {
        onClose(); //ferme la modale
        navigation.navigate('Auth', { mode: 'signup' }); //redirige vers l'écran d'authentification en mode inscription
    };

    return (
        <Modal visible={visible} transparent animationType="slide"> {/*affiche la modale en transparence et en slide*/}
            <View style={styles.container}> {/*container centré avec fond sombre*/}
                <View style={styles.modal}> {/*boîte modale blanche avec padding et bord arrondi*/}
                    <Text style={styles.title}>Connectez-vous</Text> {/*titre de la modale*/}
                    <Text style={styles.message}>
                        Vous devez vous connecter ou vous inscrire pour accéder à cette fonctionnalité.
                    </Text> {/*message informatif*/}
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Fermer</Text> {/*bouton pour fermer la modale*/}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleLoginNavigation}>
                        <Text style={styles.buttonText}>Connexion</Text> {/*bouton pour aller à la connexion*/}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleSignupNavigation}>
                        <Text style={styles.buttonText}>Inscription</Text> {/*bouton pour aller à l'inscription*/}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
    },
});

export default NotLoggedInModal;
