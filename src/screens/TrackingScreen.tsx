// src/screens/TrackingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TrackingScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Suivi</Text>
            <Text>
                Cette page permettra à l'utilisateur de suivre ses résultats et de les analyser.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

export default TrackingScreen;
