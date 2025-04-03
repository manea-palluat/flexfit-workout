// src/screens/PrivacyPolicyScreen.tsx
// IMPORT DES LIBS : on importe React et les composants de base de RN, et le texte de la politique de conf.
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { privacyPolicyText } from '../legal/legalTexts'; // texte légal chargé depuis le dossier legal

// POLITIQUE DE CONFIDENTIALITÉ
const PrivacyPolicyScreen: React.FC = () => {
    const lines = privacyPolicyText.split('\n'); // découpe le texte en lignes

    return (
        <ScrollView contentContainerStyle={styles.container}>

            <Text style={styles.mainTitle}>Politique de confidentialité - FlexFit</Text>

            <Text style={styles.date}>Dernière mise à jour : 02/04/2025</Text>
            {lines.map((line, index) => {
                const trimmed = line.trim(); // enlève les espaces superflus
                if (trimmed === '') return null; // si ligne vide, passe
                if (/^\d+\./.test(trimmed)) {
                    // si la ligne commence par un chiffre suivi d'un point, c'est un header de section
                    return (
                        <Text key={index} style={styles.sectionHeader}>
                            {trimmed}
                        </Text>
                    );
                } else {
                    // sinon, c'est un paragraphe normal avec indent
                    return (
                        <Text key={index} style={styles.paragraph}>
                            {trimmed}
                        </Text>
                    );
                }
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16, // padding global pour aérer le contenu
        backgroundColor: '#fff', // fond blanc
    },
    mainTitle: {
        fontSize: 26, // gros titre
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center', // centré
    },
    date: {
        fontSize: 14, // petit texte pour la date
        marginBottom: 16,
        textAlign: 'center',
    },
    sectionHeader: {
        fontSize: 20, // titre de section en majuscule
        fontWeight: 'bold',
        marginTop: 20, // espace avant le header
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16, // taille standard pour le texte
        lineHeight: 24, // interligne pour une meilleure lisibilité
        marginBottom: 10,
        marginLeft: 16,  // indent pour les paragraphes
        textAlign: 'justify', // texte justifié pour un rendu pro
    },
});

export default PrivacyPolicyScreen;
