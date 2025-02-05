// src/screens/ExerciseHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries'; // Ensure this query exists
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
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
                    sortDirection: "DESC", // Most recent first
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

    // Re-fetch the history every time this screen gains focus.
    useFocusEffect(
        React.useCallback(() => {
            fetchHistory();
        }, [user, exerciseName])
    );

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
            <TouchableOpacity
                style={styles.trackingItem}
                onPress={() => navigation.navigate('TrackingDetail', { tracking: item })}
            >
                <Text style={styles.trackingDate}>{formattedDate}</Text>
                {setsData.map((set, index) => (
                    <Text key={index} style={styles.setText}>
                        Série {index + 1} : {set.reps} x {set.weight} kg
                    </Text>
                ))}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (trackings.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    Tu n'as encore jamais effectué de session avec cet exercice !
                </Text>
                <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retourButtonText}>Retour</Text>
                </TouchableOpacity>
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
        paddingTop: 50, // extra top spacing
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center',
        color: '#555',
        marginBottom: 20,
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
    retourButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 20,
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ExerciseHistoryScreen;
