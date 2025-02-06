// src/screens/AddEditExerciseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { createExercise, updateExercise } from '../graphql/mutations';
import { listExercises, listExerciseTrackings } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { v4 as uuidv4 } from 'uuid';
import MuscleGroupPickerModal from '../components/MuscleGroupPickerModal';
import { updateExerciseTracking } from '../graphql/mutations'; // Ensure this mutation exists

type AddEditExerciseScreenRouteProp = RouteProp<RootStackParamList, 'AddEditExercise'>;

const AddEditExerciseScreen: React.FC = () => {
    const route = useRoute<AddEditExerciseScreenRouteProp>();
    const { exercise } = route.params || {};
    const exerciseToEdit = exercise; // if provided, we're in edit mode.
    const { user } = useAuth();
    const navigation = useNavigation();

    // Local state for the exercise fields.
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

    // Fetch distinct muscle groups from the user's existing exercises.
    useEffect(() => {
        const fetchMuscleGroups = async () => {
            try {
                const response: any = await API.graphql(
                    graphqlOperation(listExercises, {
                        filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                    })
                );
                const items = response.data.listExercises.items;
                const groups = items.map((e: any) => e.muscleGroup) as string[];
                const uniqueGroups = Array.from(new Set(groups)) as string[];
                setAvailableMuscleGroups(uniqueGroups);
                if (!exerciseToEdit) {
                    if (uniqueGroups.length > 0) {
                        setMuscleGroup(uniqueGroups[0]);
                    } else {
                        setMuscleGroup('');
                    }
                }
            } catch (error) {
                console.error('Error fetching muscle groups', error);
            }
        };
        if (user) {
            fetchMuscleGroups();
        }
    }, [user, exerciseToEdit]);

    // Helper function: Update all tracking records that have the old exercise name.
    const updateTrackingExerciseName = async (oldName: string, newExerciseName: string) => {
        try {
            let nextToken: string | null = null;
            const allTrackings: any[] = [];
            do {
                const response: any = await API.graphql(
                    graphqlOperation(listExerciseTrackings, {
                        filter: { exerciseName: { eq: oldName } },
                        nextToken, // for pagination
                    })
                );
                const { items, nextToken: token } = response.data.listExerciseTrackings;
                console.log(`Fetched ${items.length} tracking records with name ${oldName}`);
                allTrackings.push(...items);
                nextToken = token;
            } while (nextToken);

            console.log(`Total tracking records to update: ${allTrackings.length}`);

            for (const tracking of allTrackings) {
                const input = {
                    id: tracking.id,
                    exerciseName: newExerciseName,
                    _version: tracking._version, // remove or adjust if not using versioning
                };
                await API.graphql(graphqlOperation(updateExerciseTracking, { input }));
                console.log(`Updated tracking record id: ${tracking.id}`);
            }
            console.log('All tracking records updated with new exercise name.');
        } catch (error) {
            console.error('Error updating tracking exercise names:', error);
        }
    };

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
                // Edit mode: update the exercise.
                const input = {
                    userId,
                    exerciseId: exerciseToEdit.exerciseId,
                    name,
                    muscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                };
                await API.graphql(graphqlOperation(updateExercise, { input }));
                Alert.alert('Succès', 'Exercice mis à jour.');
                // If the name has changed, update all tracking records that have the old name.
                if (exerciseToEdit.name !== name) {
                    await updateTrackingExerciseName(exerciseToEdit.name, name);
                }
            } else {
                // Add mode: create a new exercise.
                const exerciseId = uuidv4();
                const input = {
                    userId,
                    exerciseId,
                    name,
                    muscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                };
                await API.graphql(graphqlOperation(createExercise, { input }));
                Alert.alert('Succès', 'Exercice créé.');
            }
            navigation.goBack();
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
            <TextInput
                style={styles.input}
                placeholder="Nom de l'exercice"
                value={name}
                onChangeText={setName}
            />

            <Text style={styles.label}>Groupe musculaire :</Text>
            <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowMuscleGroupModal(true)}
            >
                <Text style={styles.selectorButtonText}>
                    {muscleGroup ? muscleGroup : 'Sélectionner un groupe'}
                </Text>
            </TouchableOpacity>
            <MuscleGroupPickerModal
                visible={showMuscleGroupModal}
                muscleGroups={availableMuscleGroups}
                onSelect={(selected) => setMuscleGroup(selected)}
                onClose={() => setShowMuscleGroupModal(false)}
            />

            <Text style={styles.label}>Temps de repos (sec) :</Text>
            <TextInput
                style={styles.input}
                placeholder="Temps de repos (sec)"
                keyboardType="numeric"
                value={restTime}
                onChangeText={setRestTime}
            />
            <Text style={styles.label}>Nombre de sets :</Text>
            <TextInput
                style={styles.input}
                placeholder="Nombre de sets"
                keyboardType="numeric"
                value={sets}
                onChangeText={setSets}
            />
            <Text style={styles.label}>Nombre de répétitions :</Text>
            <TextInput
                style={styles.input}
                placeholder="Nombre de répétitions"
                keyboardType="numeric"
                value={reps}
                onChangeText={setReps}
            />

            <View style={styles.buttonContainer}>
                <Button title={loading ? 'Enregistrement...' : 'Sauvegarder'} onPress={handleSave} disabled={loading} />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Annuler" onPress={() => navigation.goBack()} color="#888" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 30,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    selectorButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    selectorButtonText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        marginTop: 10,
    },
});

export default AddEditExerciseScreen;