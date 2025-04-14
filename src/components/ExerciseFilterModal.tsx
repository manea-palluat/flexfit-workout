import React from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { ButtonStyles } from '../styles/ButtonStyles';

//INTERFACE MODAL FILTRE (définition des props)
interface ExerciseFilterModalProps {
    visible: boolean;
    options: string[];
    onSelect: (selected: string) => void;
    onClose: () => void;
    title?: string;
}

//MODAL FILTRE EXERCICE
const ExerciseFilterModal: React.FC<ExerciseFilterModalProps> = ({
    visible,
    options,
    onSelect,
    onClose,
    title = "Filtrer par exercice",
}) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            {/*fond sombre pour le modal*/}
            <View style={styles.modalOverlay}>
                {/*conteneur principal du modal*/}
                <View style={styles.modalContainer}>
                    {/*titre du modal*/}
                    <Text style={styles.modalTitle}>{title}</Text>
                    {/*liste des options d'exercices*/}
                    <FlatList
                        data={options}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.itemContainer}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                {/*affichage du nom de l'option*/}
                                <Text style={styles.itemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    {/*bouton pour annuler et fermer le modal*/}
                    <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={onClose}>
                        <Text style={ButtonStyles.invertedText}>Annuler</Text>
                    </TouchableOpacity>
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
});

export default ExerciseFilterModal;
