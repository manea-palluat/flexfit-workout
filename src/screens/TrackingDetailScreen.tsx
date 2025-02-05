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
    date: string;
    setsData: string;
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

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>{tracking.exerciseName || 'Exercice Inconnu'}</Text>
                <Text style={styles.date}>Date : {fullDate}</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditTracking', { tracking })}>
                    <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={setsData}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <Text style={styles.setResult}>
                        Série {index + 1} : {item.reps} répétitions x {item.weight} kg
                    </Text>
                )}
                contentContainerStyle={styles.listContent}
            />
            <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
                <Text style={styles.retourButtonText}>Retour</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
    },
    headerContainer: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 16,
        marginBottom: 10,
    },
    editButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        marginBottom: 20,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 100,
    },
    setResult: {
        fontSize: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 4,
    },
    retourButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        position: 'absolute',
        bottom: 20,
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TrackingDetailScreen;
