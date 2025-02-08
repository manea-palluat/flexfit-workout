// src/screens/LegalNoticeScreen.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { legalNoticeText } from '../legal/legalTexts';

const LegalNoticeScreen: React.FC = () => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Mentions Légales - FlexFit</Text>
            <Text style={styles.content}>{legalNoticeText}</Text>
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
    content: {
        fontSize: 16,
        lineHeight: 24
    }
});

export default LegalNoticeScreen;
