// src/screens/TrackingDetailScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

type TrackingDetailRouteProp = RouteProp<RootStackParamList, 'TrackingDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SetResult {
    weight: number;
    reps: number;
}

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // ISO string
    setsData: string; // JSON string containing an array of set results
}

const TrackingDetailScreen: React.FC = () => {
    const route = useRoute<TrackingDetailRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const { tracking } = route.params;

    let setsData: SetResult[] = [];
    try {
        setsData = JSON.parse(tracking.setsData);
    } catch (error) {
        console.error('Error parsing setsData', error);
    }

    const fullDate = new Date(tracking.date).toLocaleString();

    const ListFooter = () => (
        <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retourButtonText}>Retour</Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={setsData}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
                <Text style={styles.setResult}>
                    Série {index + 1} : {item.reps} répétitions x {item.weight} kg
                </Text>
            )}
            ListHeaderComponent={
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>
                        {tracking.exerciseName || 'Exercice Inconnu'}
                    </Text>
                    <Text style={styles.date}>Date : {fullDate}</Text>
                </View>
            }
            ListFooterComponent={ListFooter}
            contentContainerStyle={styles.contentContainer}
        />
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 30,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    headerContainer: {
        paddingVertical: 50,
        marginTop: 50,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    date: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    setResult: {
        fontSize: 18,
        marginBottom: 12,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    retourButton: {
        marginTop: 20,
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TrackingDetailScreen;
