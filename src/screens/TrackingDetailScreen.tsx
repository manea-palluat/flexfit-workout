// src/screens/TrackingDetailScreen.tsx
// IMPORT DES LIBS : on importe React, ses hooks, et les modules de navigation et Amplify
import React, { useState, useCallback } from 'react'; // react et hooks
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'; // composants RN de base
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'; // pour la navigation et récupérer les params de route
import type { RootStackParamList } from '../types/NavigationTypes'; // typage de la navigation
import { StackNavigationProp } from '@react-navigation/stack'; // typage spécifique pour la stack navigation
import { API, graphqlOperation } from 'aws-amplify'; // API Amplify pour interroger le backend
import { getExerciseTracking } from '../graphql/queries'; // requête GraphQL pour obtenir le suivi d'exo
import { deleteExerciseTracking } from '../graphql/mutations'; // mutation GraphQL pour supprimer le suivi

// ------------------------------
// TYPES ET INTERFACES
//
type TrackingDetailRouteProp = RouteProp<RootStackParamList, 'TrackingDetail'>; // typage de la route pour TrackingDetail
type NavigationProp = StackNavigationProp<RootStackParamList>; // typage de la navigation

interface SetResult {
    weight: number; // poids utilisé dans la série
    reps: number;   // nb de rép effectuées
}

interface TrackingRecord {
    id: string;         // id du suivi
    userId: string;     // id de l'user
    exerciseId: string; // id de l'exercice
    exerciseName: string; // nom de l'exercice
    date: string;       // date en ISO string
    setsData: string;   // données des séries au format JSON string
}

// ------------------------------
// MAIN TRACKING DETAIL SCREEN : affichage du détail d'un suivi d'exercice
//
const TrackingDetailScreen: React.FC = () => {
    const route = useRoute<TrackingDetailRouteProp>(); // récupère les paramètres de la route
    const navigation = useNavigation<NavigationProp>(); // permet de naviguer entre les écrans
    const { tracking: initialTracking } = route.params; // récupère le suivi passé en paramètre

    // State local pour stocker le suivi et l'état de chargement
    const [tracking, setTracking] = useState<TrackingRecord>(initialTracking); // stockage du suivi dans le state
    const [loading, setLoading] = useState<boolean>(false); // indique si on est en train de charger

    // REFRESH AU FOCUS : recharge le suivi quand l'écran reprend le focus
    useFocusEffect(
        useCallback(() => {
            const fetchTrackingDetail = async () => { // fonction pour recharger le détail du suivi
                setLoading(true); // démarre le chargement
                try {
                    const response: any = await API.graphql(
                        graphqlOperation(getExerciseTracking, { id: tracking.id }) // récupère le suivi par son id
                    );
                    if (response.data.getExerciseTracking) {
                        setTracking(response.data.getExerciseTracking); // met à jour le suivi avec les nouvelles données
                    }
                } catch (error) {
                    console.error('Error fetching tracking detail', error); // log en cas d'erreur
                } finally {
                    setLoading(false); // termine le chargement
                }
            };
            fetchTrackingDetail(); // lance la fonction
        }, [tracking.id]) // dépend de l'id du tracking
    );

    // PARSAGE DES DONNÉES DES SÉRIES : convertit le JSON en tableau
    let setsData: SetResult[] = []; // tableau qui contiendra les résultats des séries
    try {
        setsData = JSON.parse(tracking.setsData); // on parse le JSON stocké dans setsData
    } catch (error) {
        console.error('Error parsing setsData', error); // log en cas d'erreur de parsing
    }

    // FORMATAGE DE LA DATE : transforme la date ISO en format local
    const fullDate = new Date(tracking.date).toLocaleString(); // convertit la date en string lisible

    // FONCTION : gestion de la suppression du suivi
    const handleDelete = async () => {
        Alert.alert(
            'Confirmer la suppression', // titre de l'alerte
            'Voulez-vous vraiment supprimer ce suivi ?', // message de confirmation
            [
                { text: 'Annuler', style: 'cancel' }, // option d'annulation
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => { // action à exécuter en cas de confirmation
                        try {
                            const input = { id: tracking.id }; // on envoie uniquement l'id du suivi
                            await API.graphql(graphqlOperation(deleteExerciseTracking, { input })); // appel API pour supprimer
                            Alert.alert('Succès', 'Suivi supprimé.'); // notif de succès
                            navigation.goBack(); // revient à l'écran précédent
                        } catch (error) {
                            console.error('Error deleting tracking record', error); // log en cas d'erreur
                            Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.'); // notif d'erreur
                        }
                    },
                },
            ]
        );
    };

    // ------------------------------
    // RENDER : affichage de l'écran de détail du suivi
    //
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>
                    {tracking.exerciseName || 'Exercice Inconnu'}
                    {/* affiche le nom de l'exo ou "Exercice Inconnu" */}
                </Text>
                <Text style={styles.date}>Date : {fullDate}</Text> {/* affiche la date formatée */}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditTracking', { tracking })}
                // navigate vers l'écran d'édition en passant le suivi courant
                >
                    <Text style={styles.editButtonText}>Modifier</Text> {/* bouton pour modifier */}
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" /> // affiche un loader pendant le chargement
            ) : (
                <FlatList
                    data={setsData} // liste des séries du suivi
                    keyExtractor={(_, index) => index.toString()} // clé basée sur l'index de chaque série
                    renderItem={({ item, index }) => (
                        <Text style={styles.setResult}>
                            Série {index + 1} : {item.reps} répétitions x {item.weight} kg
                            {/* affiche le détail de chaque série */}
                        </Text>
                    )}
                    contentContainerStyle={styles.listContent} // style pour le conteneur de la liste
                />
            )}

            <View style={styles.footerContainer}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Supprimer</Text> {/* bouton pour supprimer le suivi */}
                </TouchableOpacity>
                <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retourButtonText}>Retour</Text> {/* bouton pour revenir */}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // fond blanc
        paddingHorizontal: 16,
    },
    headerContainer: {
        paddingTop: 50, // padding en haut pour éviter que le header soit collé
        paddingBottom: 20,
        alignItems: 'center', // centrer le contenu du header
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
        backgroundColor: '#FFA500', // bouton orange pour l'édition
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
        paddingBottom: 100, // espace en bas pour ne pas masquer le contenu de la liste
    },
    setResult: {
        fontSize: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 4,
    },
    footerContainer: {
        flexDirection: 'row', // agencement horizontal des boutons
        justifyContent: 'space-around', // espace égal entre les boutons
        alignItems: 'center',
        marginBottom: 20,
    },
    deleteButton: {
        backgroundColor: '#DC3545', // bouton rouge pour supprimer
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
        backgroundColor: '#007BFF', // bouton bleu pour le retour
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
