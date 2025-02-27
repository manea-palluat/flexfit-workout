// src/screens/TermsOfUseScreen.tsx
// IMPORTS : on importe React et les composants de base de RN
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { termsOfUseText } from '../legal/legalTexts'; // texte légal chargé depuis le dossier legal

// TERMES D'UTILISATION
const TermsOfUseScreen: React.FC = () => {
    const lines = termsOfUseText.split('\n'); // découpe le texte en lignes
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* TITRE PRINCIPAL */}
            <Text style={styles.mainTitle}>Conditions Générales d’Utilisation (CGU) - FlexFit</Text>
            {/* Date de mise à jour */}
            <Text style={styles.date}>Dernière mise à jour : [Date]</Text>
            {lines.map((line, index) => {
                const trimmed = line.trim(); // enlève les espaces superflus
                if (trimmed === '') return null; // si ligne vide, on passe
                if (/^\d+\./.test(trimmed)) {
                    // Si la ligne commence par un numéro suivi d'un point, c'est un titre de section
                    return (
                        <Text key={index} style={styles.sectionHeader}>
                            {trimmed}
                        </Text>
                    );
                } else {
                    // sinon, c'est un paragraphe classique
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
        padding: 16, // padding pour aérer le contenu
        backgroundColor: '#fff' // fond blanc, simple et propre
    },
    mainTitle: {
        fontSize: 26, // gros titre
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center' // centré
    },
    date: {
        fontSize: 14, // petit texte pour la date
        marginBottom: 16,
        textAlign: 'center'
    },
    sectionHeader: {
        fontSize: 20, // titre de section en plus grand
        fontWeight: 'bold',
        marginTop: 20, // espace avant le titre
        marginBottom: 8
    },
    paragraph: {
        fontSize: 16, // taille classique pour les paragraphes
        lineHeight: 24, // interligne pour une lecture agréable
        marginBottom: 10,
        marginLeft: 16, // petit décalage pour les paragraphes
        textAlign: 'justify' // texte justifié pour un rendu pro
    }
});

export default TermsOfUseScreen;
