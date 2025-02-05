// src/screens/TrackingScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries'; // Ensure this query exists
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // ISO string
    setsData: string; // JSON string
}

const TrackingScreen: React.FC = () => {
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    // Use useFocusEffect to refresh tracking data every time the screen is focused.
    useFocusEffect(
        React.useCallback(() => {
            fetchTrackings();
        }, [user])
    );

    // Also fetch on initial mount
    useEffect(() => {
        fetchTrackings();
    }, [user]);

    const fetchTrackings = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExerciseTrackings, {
                    filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                    sortDirection: "DESC", // most recent first
                })
            );
            const items: TrackingRecord[] = response.data.listExerciseTrackings.items;
            setTrackings(items);
        } catch (error) {
            console.error('Error fetching tracking data', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        // Format date as "DD/MM"
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;

        // Parse the setsData JSON to create a summary string.
        let setSummary = '';
        try {
            const setsData = JSON.parse(item.setsData);
            setSummary = setsData
                .map((set: { reps: number; weight: number }) => `${set.reps} x ${set.weight} kg`)
                .join('\n');
        } catch (e) {
            console.error('Error parsing setsData', e);
        }

        return (
            <TouchableOpacity
                style={styles.recordItem}
                onPress={() => navigation.navigate('TrackingDetail', { tracking: item })}
            >
                <Text style={styles.recordTitle}>
                    {item.exerciseName} - {formattedDate}
                </Text>
                <Text style={styles.recordSummary}>{setSummary}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Chargement des données de suivi...</Text>
            </View>
        );
    }

    if (trackings.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Aucune donnée de suivi trouvée.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={trackings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.contentContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordItem: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 12,
    },
    recordTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    recordSummary: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
});

export default TrackingScreen;
