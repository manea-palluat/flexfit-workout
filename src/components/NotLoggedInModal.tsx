// src/components/NotLoggedInModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface NotLoggedInModalProps {
    visible: boolean;
    onClose: () => void;
}

const NotLoggedInModal: React.FC<NotLoggedInModalProps> = ({ visible, onClose }) => {
    const navigation = useNavigation<NavigationProp>();

    const handleLoginNavigation = () => {
        onClose();
        navigation.navigate('Auth', { mode: 'login' });
    };

    const handleSignupNavigation = () => {
        onClose();
        navigation.navigate('Auth', { mode: 'signup' });
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.container}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Connectez-vous</Text>
                    <Text style={styles.message}>
                        Vous devez vous connecter ou vous inscrire pour accéder à cette fonctionnalité.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Fermer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleLoginNavigation}>
                        <Text style={styles.buttonText}>Connexion</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleSignupNavigation}>
                        <Text style={styles.buttonText}>Inscription</Text>
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
