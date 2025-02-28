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
import { listExerciseTrackings } from '../graphql/queries'; // Ne touche pas aux imports
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type ExerciseHistoryRouteProp = RouteProp<RootStackParamList, 'ExerciseHistory'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

// DEFINITIONS : type du suivi d'exercice
interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // chaîne ISO
    setsData: string; // chaîne JSON contenant un tableau de résultats de séries
}

const ExerciseHistoryScreen: React.FC = () => {
    const route = useRoute<ExerciseHistoryRouteProp>(); // récupère les params de la route
    const navigation = useNavigation<NavigationProp>(); // pour naviguer entre écrans
    const { exerciseName } = route.params; // filtre sur le nom de l'exo
    const { user } = useAuth(); // récupère l'utilisateur
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]); // stocke l'historique
    const [loading, setLoading] = useState<boolean>(true); // pour afficher le loader

    // FONCTION : récupère l'historique depuis l'API
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
                    sortDirection: "DESC", // le plus récent en premier
                })
            );
            let items: TrackingRecord[] = response.data.listExerciseTrackings.items;
            // trie les items par date décroissante (le plus récent en premier)
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrackings(items);
        } catch (error) {
            console.error('Error fetching exercise history', error); // erreur de fetch
        } finally {
            setLoading(false);
        }
    };

    // UTILISATION DE USEFOCUSEFFECT : refait le fetch à chaque fois que l'écran est focus
    useFocusEffect(
        React.useCallback(() => {
            fetchHistory();
        }, [user, exerciseName])
    );

    // FONCTION : rend chaque item de suivi
    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        // formate la date en "DD/MM/YYYY HH:MM"
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
            console.error('Error parsing setsData', e); // pb de parsing
        }
        return (
            <TouchableOpacity
                style={styles.trackingItem}
                onPress={() => navigation.navigate('TrackingDetail', { tracking: item })} // ouvre le détail du suivi
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
                <ActivityIndicator size="large" color="#007BFF" /> {/* affichage loader */}
            </View>
        );
    }

    if (trackings.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    Tu n'as encore jamais effectué de session avec cet exo !
                </Text>
                <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retourButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ENTÊTE */}
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
        paddingTop: 50, // espacement top en plus
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
