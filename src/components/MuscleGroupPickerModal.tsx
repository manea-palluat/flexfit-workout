// src/components/MuscleGroupPickerModal.tsx
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
    visible: boolean;
    muscleGroups: string[];
    onSelect: (selected: string) => void;
    onClose: () => void;
}

const MuscleGroupPickerModal: React.FC<MuscleGroupPickerModalProps> = ({
    visible,
    muscleGroups,
    onSelect,
    onClose,
}) => {
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [newGroup, setNewGroup] = useState<string>('');

    const handleAddNew = () => {
        const trimmed = newGroup.trim();
        if (trimmed.length === 0) return;
        onSelect(trimmed);
        setNewGroup('');
        setIsAdding(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {!isAdding ? (
                        <>
                            <Text style={styles.modalTitle}>Choisir un groupe musculaire</Text>
                            <FlatList
                                data={muscleGroups}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.itemContainer}
                                        onPress={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.itemText}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={ButtonStyles.container} onPress={() => setIsAdding(true)}>
                                <Text style={ButtonStyles.text}>Ajouter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={onClose}>
                                <Text style={ButtonStyles.invertedText}>Annuler</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.modalTitle}>Ajouter un nouveau groupe musculaire</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom du groupe"
                                placeholderTextColor="#999"
                                value={newGroup}
                                onChangeText={setNewGroup}
                            />
                            <TouchableOpacity style={ButtonStyles.container} onPress={handleAddNew}>
                                <Text style={ButtonStyles.text}>Valider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={() => {
                                setIsAdding(false);
                                setNewGroup('');
                            }}>
                                <Text style={ButtonStyles.invertedText}>Annuler</Text>
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

export default MuscleGroupPickerModal;
