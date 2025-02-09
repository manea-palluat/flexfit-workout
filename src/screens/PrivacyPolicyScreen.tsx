// src/screens/PrivacyPolicyScreen.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { privacyPolicyText } from '../legal/legalTexts';

const PrivacyPolicyScreen: React.FC = () => {
    // Split the legal text by newline
    const lines = privacyPolicyText.split('\n');

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.mainTitle}>Politique de Confidentialité - FlexFit</Text>
            <Text style={styles.date}>Dernière mise à jour : [Date]</Text>
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (trimmed === '') return null; // skip empty lines
                if (/^\d+\./.test(trimmed)) {
                    // Lines starting with a number and a dot are section headers.
                    return (
                        <Text key={index} style={styles.sectionHeader}>
                            {trimmed}
                        </Text>
                    );
                } else {
                    // Otherwise, render as a paragraph with an indent.
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
    date: {
        fontSize: 14,
        marginBottom: 16,
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
        marginLeft: 16,  // indent paragraphs
        textAlign: 'justify',
    },
});

export default PrivacyPolicyScreen;
