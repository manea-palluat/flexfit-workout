// src/screens/LegalNoticeScreen.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { legalNoticeText } from '../../legal/legalTexts';

const LegalNoticeScreen: React.FC = () => {
    const lines = legalNoticeText.split('\n'); //découpe le texte en lignes

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.mainTitle}>Mentions Légales - FlexFit</Text>
            {lines.map((line, index) => {
                const trimmed = line.trim(); //enlève les espaces en début et fin
                if (trimmed === '') return null; //ignore les lignes vides
                if (/^\d+\./.test(trimmed)) { //si la ligne commence par un chiffre suivi d'un point, c'est un header de section
                    return (
                        <Text key={index} style={styles.sectionHeader}>
                            {trimmed}
                        </Text>
                    );
                } else {
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
        padding: 16,
        backgroundColor: '#fff',
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 10,
        marginLeft: 16,
        textAlign: 'justify',
    },
});

export default LegalNoticeScreen;
