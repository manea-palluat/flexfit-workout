//src/screens/AboutScreen.tsx
import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

type AboutNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

const AboutScreen: React.FC = () => {
    const navigation = useNavigation<AboutNavigationProp>(); //on récupère la navigation

    return (
        //CONTENEUR PRINCIPAL
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>À propos de FlexFit</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('TermsOfUse')}
            >
                <Text style={styles.buttonText}>
                    Conditions Générales d’Utilisation
                </Text>
                {/*bouton pour les CGU*/}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('PrivacyPolicy')}
            >
                <Text style={styles.buttonText}>
                    Politique de Confidentialité
                </Text>
                {/*bouton pour la politique de confidentialité*/}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('LegalNotice')}
            >
                <Text style={styles.buttonText}>Mentions Légales</Text>
                {/*bouton pour les mentions légales*/}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>Retour</Text>
                {/*retour à l'écran précédent*/}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,                //permet au container de s'étendre
        justifyContent: 'center',   //centre verticalement le contenu
        alignItems: 'center',       //centre horizontalement le contenu
        padding: 16,
        backgroundColor: '#fff',    //fond blanc
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',        //texte centré
    },
    button: {
        backgroundColor: '#007BFF', //couleur bleue pour le bouton
        padding: 15,
        borderRadius: 8,
        width: '90%',               //largeur de 90% du container
        alignItems: 'center',       //centre le texte du bouton
        marginVertical: 8,
    },
    buttonText: {
        color: '#fff',              //texte blanc
        fontSize: 16,
    },
    backButton: {
        marginTop: 30,
        padding: 10,
        backgroundColor: '#6C757D',  //bouton de retour en gris
        borderRadius: 8,
        width: '90%',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',              //texte blanc
        fontSize: 16,
    },
});

export default AboutScreen;
