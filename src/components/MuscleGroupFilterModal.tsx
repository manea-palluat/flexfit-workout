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

interface MuscleGroupFilterModalProps {
    visible: boolean; //affiche la modale
    options: string[]; //liste des options dispo
    onSelect: (selected: string) => void; //callback quand une option est sélectionnée
    onClose: () => void; //ferme la modale
    title?: string; //titre de la modale, par défaut "Filtrer par groupe musculaire"
}

//MODAL DE FILTRE: composant qui gère l'affichage de la modale de sélection
const MuscleGroupFilterModal: React.FC<MuscleGroupFilterModalProps> = ({
    visible,
    options,
    onSelect,
    onClose,
    title = "Filtrer par groupe musculaire",
}) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{title}</Text> {/*affiche le titre de la modale*/}
                    <FlatList
                        data={options}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.itemContainer}
                                onPress={() => {
                                    onSelect(item); //sélection de l'option
                                    onClose(); //ferme la modale après sélection
                                }}
                            >
                                <Text style={styles.itemText}>{item}</Text> {/*affiche le nom de l'option*/}
                            </TouchableOpacity>
                        )}
                    />
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

export default MuscleGroupFilterModal;
