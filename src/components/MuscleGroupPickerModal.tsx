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
                            <TouchableOpacity
                                style={styles.addNewButton}
                                onPress={() => setIsAdding(true)}
                            >
                                <Text style={styles.addNewButtonText}>Ajouter un nouveau groupe musculaire</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeButtonText}>Annuler</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.modalTitle}>Ajouter un nouveau groupe musculaire</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom du groupe"
                                value={newGroup}
                                onChangeText={setNewGroup}
                            />
                            <TouchableOpacity style={styles.addNewButton} onPress={handleAddNew}>
                                <Text style={styles.addNewButtonText}>Valider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setIsAdding(false);
                                    setNewGroup('');
                                }}
                            >
                                <Text style={styles.closeButtonText}>Annuler</Text>
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
    },
    itemContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    itemText: {
        fontSize: 16,
        textAlign: 'center',
    },
    addNewButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        borderRadius: 5,
        marginTop: 12,
    },
    addNewButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 12,
        backgroundColor: '#6C757D',
        paddingVertical: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        marginBottom: 12,
    },
});

export default MuscleGroupPickerModal;
