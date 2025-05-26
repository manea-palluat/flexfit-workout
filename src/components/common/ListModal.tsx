import React, { useState } from 'react'
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet
} from 'react-native'
import { Button } from './Button'
import { TextInputStyles } from '../../styles/TextInputStyles'

interface Props<T> {
    visible: boolean
    items: T[]
    onSelect: (item: T) => void
    onClose: () => void
    keyExtractor: (item: T) => string
    renderItem?: (item: T) => React.ReactNode
    title?: string
    /** callback pour ajouter un nouvel item (local seulement) */
    onAdd?: (item: T) => void
    /** placeholder pour le champ d’ajout */
    addPlaceholder?: string
}

export default function ListModal<T>({
    visible,
    items,
    onSelect,
    onClose,
    keyExtractor,
    renderItem,
    title = 'Choisir',
    onAdd,
    addPlaceholder = 'Ajouter…'
}: Props<T>) {
    const [newItem, setNewItem] = useState('')

    const _render = ({ item }: { item: T }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => { onSelect(item); onClose() }}
        >
            {renderItem
                ? renderItem(item)
                : <Text style={styles.itemText}>{String(item)}</Text>
            }
        </TouchableOpacity>
    )

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title}</Text>

                    {onAdd && (
                        <View style={styles.addContainer}>
                            <View style={[TextInputStyles.container, styles.inputWrapper]}>
                                <TextInput
                                    style={[TextInputStyles.input, styles.input]}
                                    placeholder={addPlaceholder}
                                    placeholderTextColor="#999"
                                    value={newItem}
                                    onChangeText={setNewItem}
                                    returnKeyType="done"
                                    onSubmitEditing={() => {
                                        const t = newItem.trim()
                                        if (!t) return
                                        onAdd(t as any)
                                        setNewItem('')
                                    }}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.indicator}
                                onPress={() => {
                                    const t = newItem.trim()
                                    if (!t) return
                                    onAdd(t as any)
                                    setNewItem('')
                                }}
                            />
                        </View>
                    )}

                    <FlatList
                        data={items}
                        keyExtractor={keyExtractor}
                        renderItem={_render}
                        contentContainerStyle={styles.list}
                    />

                    <Button
                        title="Annuler"
                        onPress={onClose}
                        variant="inverted"
                        style={styles.cancelButton}
                    />
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        width: '85%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
    },
    addContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%'
    },
    inputWrapper: {
        flex: 1,
        marginRight: 8
    },
    input: {
        height: 40
    },
    indicator: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#B21AE5'
    },
    list: {
        paddingBottom: 12
    },
    item: {
        backgroundColor: '#F1F1F1',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8
    },
    itemText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center'
    },
    cancelButton: {
        marginTop: 12,
        width: '100%'
    }
})