// src/screens/AboutScreen.tsx
import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

type AboutNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

const AboutScreen: React.FC = () => {
    const navigation = useNavigation<AboutNavigationProp>();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>À propos de FlexFit</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('TermsOfUse')}
            >
                <Text style={styles.buttonText}>Conditions Générales d’Utilisation</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('PrivacyPolicy')}
            >
                <Text style={styles.buttonText}>Politique de Confidentialité</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('LegalNotice')}
            >
                <Text style={styles.buttonText}>Mentions Légales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,                // allows the container to grow
        justifyContent: 'center',   // vertically center the content
        alignItems: 'center',       // horizontally center the content
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 8,
        width: '90%',
        alignItems: 'center',
        marginVertical: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    backButton: {
        marginTop: 30,
        padding: 10,
        backgroundColor: '#6C757D',
        borderRadius: 8,
        width: '90%',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default AboutScreen;
