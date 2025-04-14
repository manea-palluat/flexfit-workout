import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
} from 'react-native';
import { ButtonStyles } from '../styles/ButtonStyles';

interface MuscleGroupPickerModalProps {
    visible: boolean; //affiche la modale
    muscleGroups: string[]; //liste des groupes dispo
    onSelect: (selected: string) => void; //callback pour sélectionner un groupe
    onClose: () => void; //callback pour fermer la modale
}

const MuscleGroupPickerModal: React.FC<MuscleGroupPickerModalProps> = ({
    visible,
    muscleGroups,
    onSelect,
    onClose,
}) => {
    const [isAdding, setIsAdding] = useState<boolean>(false); //mode ajout activé ou pas
    const [newGroup, setNewGroup] = useState<string>(''); //stocke le nouveau nom saisi

    const handleAddNew = () => {
        const trimmed = newGroup.trim(); //nettoie les espaces superflus
        if (trimmed.length === 0) return; //si vide, rien à faire
        onSelect(trimmed); //sélectionne le nouveau groupe
        setNewGroup(''); //réinitialise le champ
        setIsAdding(false); //désactive le mode ajout
        onClose(); //ferme la modale
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>{/*OVERLAY: fond sombre de la modale*/}
                <View style={styles.modalContainer}>{/*CONTENEUR PRINCIPAL DE LA MODALE*/}
                    {!isAdding ? (
                        <>
                            <Text style={styles.modalTitle}>Choisir un groupe musculaire</Text> {/*TITRE: demande de sélection*/}
                            <FlatList
                                data={muscleGroups}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.itemContainer}
                                        onPress={() => {
                                            onSelect(item); //sélectionne l'item cliqué
                                            onClose(); //ferme la modale après choix
                                        }}
                                    >
                                        <Text style={styles.itemText}>{item}</Text> {/*affiche le nom du groupe*/}
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={ButtonStyles.container} onPress={() => setIsAdding(true)}>
                                <Text style={ButtonStyles.text}>Ajouter</Text> {/*bouton pour ajouter un nouveau groupe*/}
                            </TouchableOpacity>
                            <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={onClose}>
                                <Text style={ButtonStyles.invertedText}>Annuler</Text> {/*bouton pour annuler et fermer*/}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.modalTitle}>Ajouter un nouveau groupe musculaire</Text> {/*TITRE: mode ajout activé*/}
                            <TextInput
                                style={styles.input}
                                placeholder="Nom du groupe"
                                placeholderTextColor="#999"
                                value={newGroup}
                                onChangeText={setNewGroup} //met à jour la saisie en direct
                            />
                            <TouchableOpacity style={ButtonStyles.container} onPress={handleAddNew}>
                                <Text style={ButtonStyles.text}>Valider</Text> {/*bouton pour confirmer l'ajout*/}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={ButtonStyles.invertedContainer}
                                onPress={() => {
                                    setIsAdding(false); //sort du mode ajout
                                    setNewGroup(''); //réinitialise le champ
                                }}
                            >
                                <Text style={ButtonStyles.invertedText}>Annuler</Text> {/*annule l'ajout*/}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        maxHeight: '70%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#333',
    },
    itemContainer: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginBottom: 10,
    },
    itemText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 5,
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
});

export default MuscleGroupPickerModal; //export du composant
