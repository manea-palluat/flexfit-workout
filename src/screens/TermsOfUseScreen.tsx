// src/screens/TermsOfUseScreen.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { termsOfUseText } from '../legal/legalTexts';

const TermsOfUseScreen: React.FC = () => {
    const lines = termsOfUseText.split('\n');
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.mainTitle}>Conditions Générales d’Utilisation (CGU) - FlexFit</Text>
            <Text style={styles.date}>Dernière mise à jour : [Date]</Text>
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (trimmed === '') return null;
                if (/^\d+\./.test(trimmed)) {
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
        backgroundColor: '#fff'
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center'
    },
    date: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center'
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 10,
        marginLeft: 16,
        textAlign: 'justify'
    }
});

export default TermsOfUseScreen;
