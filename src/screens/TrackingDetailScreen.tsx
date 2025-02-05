// src/screens/TrackingDetailScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { API, graphqlOperation } from 'aws-amplify';
import { getExerciseTracking } from '../graphql/queries';

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
    // We initially get the tracking record from route parameters.
    const { tracking: initialTracking } = route.params;

    // Use local state to store the tracking record.
    const [tracking, setTracking] = useState<TrackingRecord>(initialTracking);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch the updated tracking record by ID whenever the screen is focused.
    useFocusEffect(
        useCallback(() => {
            const fetchTrackingDetail = async () => {
                setLoading(true);
                try {
                    const response: any = await API.graphql(
                        graphqlOperation(getExerciseTracking, { id: tracking.id })
                    );
                    if (response.data.getExerciseTracking) {
                        setTracking(response.data.getExerciseTracking);
                    }
                } catch (error) {
                    console.error('Error fetching tracking detail', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTrackingDetail();
        }, [tracking.id])
    );

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
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditTracking', { tracking })}
                >
                    <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : (
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
            )}

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
