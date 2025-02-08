// src/screens/PrivacyPolicyScreen.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { privacyPolicyText } from '../legal/legalTexts';

const PrivacyPolicyScreen: React.FC = () => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Politique de Confidentialité - FlexFit</Text>
            <Text style={styles.date}>Dernière mise à jour : [Date]</Text>
            <Text style={styles.content}>{privacyPolicyText}</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8
    },
    date: {
        fontSize: 14,
        marginBottom: 16
    },
    content: {
        fontSize: 16,
        lineHeight: 24
    }
});

export default PrivacyPolicyScreen;
