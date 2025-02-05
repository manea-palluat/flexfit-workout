// src/screens/ExerciseHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries'; // Ensure this query exists
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type ExerciseHistoryRouteProp = RouteProp<RootStackParamList, 'ExerciseHistory'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // ISO string
    setsData: string; // JSON string containing an array of set results
}

const ExerciseHistoryScreen: React.FC = () => {
    const route = useRoute<ExerciseHistoryRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const { exerciseName } = route.params; // The exercise name to filter by
    const { user } = useAuth();
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const fetchHistory = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const userId = user?.attributes?.sub || user?.username;
            const response: any = await API.graphql(
                graphqlOperation(listExerciseTrackings, {
                    filter: {
                        userId: { eq: userId },
                        exerciseName: { eq: exerciseName },
                    },
                    sortDirection: "DESC", // most recent first
                })
            );
            let items: TrackingRecord[] = response.data.listExerciseTrackings.items;
            // Sort items by date descending (most recent first)
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrackings(items);
        } catch (error) {
            console.error('Error fetching exercise history', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        // Format the date as "DD/MM/YYYY HH:MM"
        const formattedDate = dateObj.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        let setsData: { reps: number; weight: number }[] = [];
        try {
            setsData = JSON.parse(item.setsData);
        } catch (e) {
            console.error('Error parsing setsData', e);
        }
        return (
            <View style={styles.trackingItem}>
                <Text style={styles.trackingDate}>{formattedDate}</Text>
                {setsData.map((set, index) => (
                    <Text key={index} style={styles.setText}>
                        Série {index + 1} : {set.reps} x {set.weight} kg
                    </Text>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>{exerciseName}</Text>
            </View>
            <FlatList
                data={trackings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text>Aucune donnée de suivi pour cet exercice.</Text>
                    </View>
                }
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
        paddingTop: 50, // Extra top padding so the header isn't flush with the top edge
        paddingBottom: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 100,
    },
    trackingItem: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 12,
    },
    trackingDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    setText: {
        fontSize: 16,
        marginBottom: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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

export default ExerciseHistoryScreen;