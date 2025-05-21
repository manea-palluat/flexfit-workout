// src/components/common/ListModal.tsx
import React from 'react'
import {
    Modal, View, Text, FlatList, TouchableOpacity, StyleSheet
} from 'react-native'
import Button from "./Button"

interface Props<T> {
    visible: boolean
    items: T[]
    onSelect: (item: T) => void
    onClose: () => void
    keyExtractor: (item: T) => string
    renderItem?: (item: T) => React.ReactNode
    title?: string
}

export default function ListModal<T>({
    visible, items, onSelect, onClose,
    keyExtractor, renderItem, title = 'Choisir'
}: Props<T>) {
    const _render = ({ item }: { item: T }) => (
        <TouchableOpacity
            style={s.item}
            onPress={() => { onSelect(item); onClose() }}
        >
            {renderItem ? renderItem(item) : <Text style={s.itemText}>{String(item)}</Text>}
        </TouchableOpacity>
    )
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={s.overlay}>
                <View style={s.container}>
                    <Text style={s.title}>{title}</Text>
                    <FlatList
                        data={items}
                        keyExtractor={keyExtractor}
                        renderItem={_render}
                    />
                    <Button title="Annuler" onPress={onClose} variant="inverted" />
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center'
    },
    container: {
        width: '80%', maxHeight: '70%',
        backgroundColor: '#fff', borderRadius: 8, padding: 20
    },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    item: {
        backgroundColor: '#F1F1F1',
        padding: 12, borderRadius: 5, marginBottom: 8
    },
    itemText: { fontSize: 16, textAlign: 'center', color: '#333' }
})
