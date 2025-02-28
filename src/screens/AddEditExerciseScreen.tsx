// src/screens/AddEditExerciseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Alert,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { createExercise, updateExercise } from '../graphql/mutations';
import { listExercises, listExerciseTrackings } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { v4 as uuidv4 } from 'uuid';
import MuscleGroupPickerModal from '../components/MuscleGroupPickerModal';
import { updateExerciseTracking } from '../graphql/mutations';
import { ButtonStyles } from '../styles/ButtonStyles';

type AddEditExerciseScreenRouteProp = RouteProp<RootStackParamList, 'AddEditExercise'>;

const AddEditExerciseScreen: React.FC = () => {
    const route = useRoute<AddEditExerciseScreenRouteProp>();
    const { exercise } = route.params || {};
    const exerciseToEdit = exercise; //si fourni, mode édition
    const { user } = useAuth();
    const navigation = useNavigation();

    // ETAT LOCAL : stocke les données de l'exercice
    const [name, setName] = useState(exerciseToEdit ? exerciseToEdit.name : '');
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
    const [muscleGroup, setMuscleGroup] = useState(
        exerciseToEdit ? exerciseToEdit.muscleGroup : ''
    );
    const [showMuscleGroupModal, setShowMuscleGroupModal] = useState<boolean>(false);
    const [restTime, setRestTime] = useState(
        exerciseToEdit ? exerciseToEdit.restTime.toString() : ''
    );
    const [sets, setSets] = useState(
        exerciseToEdit ? exerciseToEdit.sets.toString() : ''
    );
    const [reps, setReps] = useState(
        exerciseToEdit ? exerciseToEdit.reps.toString() : ''
    );
    const [loading, setLoading] = useState<boolean>(false);
    // nouvel état : type d'exercice ('normal' ou 'bodyweight')
    const [exerciseType, setExerciseType] = useState(
        exerciseToEdit ? exerciseToEdit.exerciseType || 'normal' : 'normal'
    );

    // FETCH DES GROUPES MUSCULAIRES : récupère les groupes distincts de l'utilisateur
    useEffect(() => {
        const fetchMuscleGroups = async () => {
            try {
                const response: any = await API.graphql(
                    graphqlOperation(listExercises, {
                        filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                    })
                );
                const items = response.data.listExercises.items;
                const groups = items.map((e: any) => e.muscleGroup) as string[]; //récupère le groupe de chaque exercice
                const uniqueGroups = Array.from(new Set(groups)) as string[];
                setAvailableMuscleGroups(uniqueGroups);
                if (!exerciseToEdit) {
                    setMuscleGroup(uniqueGroups.length > 0 ? uniqueGroups[0] : '');
                }
            } catch (error) {
                console.error('Error fetching muscle groups', error); //en cas d'erreur lors du fetch
            }
        };
        if (user) { //on vérifie que l'utilisateur est connecté
            fetchMuscleGroups();
        }
    }, [user, exerciseToEdit]);

    // FONCTION UTILE : met à jour le nom de l'exercice dans tous les enregistrements de tracking
    const updateTrackingExerciseName = async (oldName: string, newExerciseName: string) => {
        try {
            let nextToken: string | null = null;
            const allTrackings: any[] = [];
            do {
                const response: any = await API.graphql(
                    graphqlOperation(listExerciseTrackings, {
                        filter: { exerciseName: { eq: oldName } },
                        nextToken, //pour la pagination
                    })
                );
                const { items, nextToken: token } = response.data.listExerciseTrackings;
                allTrackings.push(...items);
                nextToken = token;
            } while (nextToken);

            for (const tracking of allTrackings) {
                const input = {
                    id: tracking.id,
                    exerciseName: newExerciseName,
                    _version: tracking._version, //si versioning utilisé
                };
                await API.graphql(graphqlOperation(updateExerciseTracking, { input }));
            }
        } catch (error) {
            console.error('Error updating tracking exercise names:', error); //gestion d'erreur
        }
    };

    // FONCTION PRINCIPALE : sauvegarde l'exercice (ajout ou édition)
    const handleSave = async () => {
        if (!name || !muscleGroup || !restTime || !sets || !reps) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }

        const restTimeNum = parseInt(restTime, 10);
        const setsNum = parseInt(sets, 10);
        const repsNum = parseInt(reps, 10);

        if (isNaN(restTimeNum) || isNaN(setsNum) || isNaN(repsNum)) {
            Alert.alert(
                'Erreur',
                'Veuillez entrer des valeurs numériques valides pour le temps de repos, le nombre de sets et de répétitions.'
            );
            return;
        }

        setLoading(true);
        try {
            const userId = user?.attributes?.sub || user?.username;
            if (!userId) {
                Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
                return;
            }
            if (exerciseToEdit && exerciseToEdit.exerciseId) {
                // mode édition : met à jour l'exercice existant
                const input = {
                    userId,
                    exerciseId: exerciseToEdit.exerciseId,
                    name,
                    muscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                    exerciseType, //nouveau champ inclus
                };
                await API.graphql(graphqlOperation(updateExercise, { input }));
                Alert.alert('Succès', 'Exercice mis à jour.');
                if (exerciseToEdit.name !== name) { //si le nom a changé, on met à jour le tracking
                    await updateTrackingExerciseName(exerciseToEdit.name, name);
                }
            } else {
                // mode ajout : création d'un nouvel exercice
                const exerciseId = uuidv4();
                const input = {
                    userId,
                    exerciseId,
                    name,
                    muscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                    exerciseType, //nouveau champ inclus
                };
                await API.graphql(graphqlOperation(createExercise, { input }));
                Alert.alert('Succès', 'Exercice créé.');
            }
            navigation.goBack(); //retour à l'écran précédent
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'exercice", error);
            Alert.alert(
                'Erreur',
                "Une erreur est survenue lors de la sauvegarde de l'exercice."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>
                {exerciseToEdit ? "Modifier l'exercice" : "Ajouter un exercice"}
            </Text>
            <View style={styles.formContainer}>
                {/* NOM DE L'EXERCICE */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nom de l'exercice</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom de l'exercice"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName} //maj du nom
                    />
                </View>

                {/* SÉLECTEUR DE GROUPE MUSCULAIRE */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Groupe musculaire</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowMuscleGroupModal(true)} //ouvre le modal de sélection
                    >
                        <Text style={styles.inputText}>
                            {muscleGroup ? muscleGroup : 'Sélectionner un groupe'}
                        </Text>
                    </TouchableOpacity>
                    <MuscleGroupPickerModal
                        visible={showMuscleGroupModal}
                        muscleGroups={availableMuscleGroups}
                        onSelect={(selected) => {
                            setMuscleGroup(selected); //choix du groupe
                            setShowMuscleGroupModal(false);
                        }}
                        onClose={() => setShowMuscleGroupModal(false)}
                    />
                </View>

                {/* TEMPS DE REPOS */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Temps de repos (s)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Temps de repos (sec)"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={restTime}
                        onChangeText={setRestTime} //maj du temps de repos
                    />
                </View>

                {/* NOMBRE DE SÉRIES */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre de séries</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre de sets"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={sets}
                        onChangeText={setSets} //maj du nombre de sets
                    />
                </View>

                {/* NOMBRE DE RÉPÉTITIONS */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre de répétitions par série</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre de répétitions"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={reps}
                        onChangeText={setReps} //maj du nombre de répétitions
                    />
                </View>

                {/* SÉLECTEUR DE TYPE D'EXERCICE */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Type d'exercice</Text>
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[
                                styles.segment,
                                exerciseType === 'normal' && styles.segmentSelected,
                            ]}
                            onPress={() => setExerciseType('normal')} //choix normal
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    exerciseType === 'normal' && styles.segmentTextSelected,
                                ]}
                            >
                                Normal (poids)
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.segment,
                                exerciseType === 'bodyweight' && styles.segmentSelected,
                            ]}
                            onPress={() => setExerciseType('bodyweight')} //choix poids du corps
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    exerciseType === 'bodyweight' && styles.segmentTextSelected,
                                ]}
                            >
                                Poids du corps
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* BOUTON DE SAUVEGARDE */}
                <TouchableOpacity
                    style={[ButtonStyles.container, loading && { opacity: 0.7 }]}
                    onPress={handleSave} //lancement de la sauvegarde
                    disabled={loading}
                >
                    <Text style={ButtonStyles.text}>
                        {loading ? 'Enregistrement...' : 'Sauvegarder'}
                    </Text>
                </TouchableOpacity>

                {/* BOUTON D'ANNULATION */}
                <TouchableOpacity
                    style={ButtonStyles.invertedContainer}
                    onPress={() => navigation.goBack()} //retour à l'écran précédent
                >
                    <Text style={ButtonStyles.invertedText}>Annuler</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 5,
        fontSize: 16,
        color: '#333',
    },
    inputText: {
        fontSize: 16,
        color: '#333',
    },
    // STYLE DU SEGMENTED CONTROL, ressemblant à un champ de saisie
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#F1F1F1',
        borderRadius: 5,
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    segmentSelected: {
        backgroundColor: '#b21ae5',
    },
    segmentText: {
        fontSize: 16,
        color: '#333',
    },
    segmentTextSelected: {
        color: '#fff',
    },
});

export default AddEditExerciseScreen;
