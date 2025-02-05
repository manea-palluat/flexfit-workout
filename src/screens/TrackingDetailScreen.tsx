// src/screens/TrackingDetailScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { API, graphqlOperation } from 'aws-amplify';
import { getExerciseTracking } from '../graphql/queries';
import { deleteExerciseTracking } from '../graphql/mutations';

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
    // Initially, get the tracking record from route params.
    const { tracking: initialTracking } = route.params;

    // Store tracking record in local state.
    const [tracking, setTracking] = useState<TrackingRecord>(initialTracking);
    const [loading, setLoading] = useState<boolean>(false);

    // Refresh the tracking record when the screen gains focus.
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

    const handleDelete = async () => {
        Alert.alert(
            'Confirmer la suppression',
            'Voulez-vous vraiment supprimer ce suivi ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const input = { id: tracking.id }; // Only pass id!
                            await API.graphql(graphqlOperation(deleteExerciseTracking, { input }));
                            Alert.alert('Succès', 'Suivi supprimé.');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting tracking record', error);
                            Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
                        }
                    },
                },
            ]
        );
    };

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

            <View style={styles.footerContainer}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retourButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
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
        paddingTop: 50, // Extra top padding so the header isn't flush with the top edge
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
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    deleteButton: {
        backgroundColor: '#DC3545',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    retourButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
});

export default TrackingDetailScreen;
