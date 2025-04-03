// src/screens/ExerciseHistoryScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type ExerciseHistoryRouteProp = RouteProp<RootStackParamList, 'ExerciseHistory'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // ISO string
    setsData: string; // JSON string representing an array of set results
}

const ExerciseHistoryScreen: React.FC = () => {
    const route = useRoute<ExerciseHistoryRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const { exerciseName } = route.params;
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
                    sortDirection: "DESC",
                })
            );
            let items: TrackingRecord[] = response.data.listExerciseTrackings.items;
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrackings(items);
        } catch (error) {
            console.error('Error fetching exercise history', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchHistory();
        }, [user, exerciseName])
    );

    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
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

    return (
        <View style={styles.container}>
            {/* Header with back arrow and exercise title */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backIconContainer}
                >
                    <Ionicons name="arrow-back-outline" size={24} color="#007BFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{exerciseName}</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007BFF" />
                </View>
            ) : trackings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Tu n'as encore jamais effectué de session avec cet exo !
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={trackings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backIconContainer: {
        paddingRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginRight: 32, // to balance the back icon
    },
    listContent: {
        padding: 16,
        paddingBottom: 30,
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
        padding: 16,
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center',
        color: '#555',
    },
    trackingItem: {
        backgroundColor: '#F2F0F5',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        // Elevation for Android
        elevation: 2,
    },
    trackingDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    setText: {
        fontSize: 16,
        marginBottom: 4,
        color: '#555',
    },
});

export default ExerciseHistoryScreen;
