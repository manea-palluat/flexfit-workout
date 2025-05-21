// src/components/common/SegmentedControl.tsx
import React from 'react'
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
} from 'react-native'
import { TextStyles } from '../../styles/TextStyles'

export type Segment<T extends string> = {
    label: string
    value: T
}

interface SegmentedControlProps<T extends string> {
    segments: Segment<T>[]
    selectedValue: T
    onValueChange: (value: T) => void
    style?: ViewStyle
}

function SegmentedControl<T extends string>({
    segments,
    selectedValue,
    onValueChange,
    style,
}: SegmentedControlProps<T>) {
    return (
        <View style={[styles.container, style]}>
            {segments.map((seg) => {
                const isActive = seg.value === selectedValue
                return (
                    <TouchableOpacity
                        key={seg.value}
                        onPress={() => onValueChange(seg.value)}
                        style={[
                            styles.segment,
                            isActive ? styles.activeSegment : styles.inactiveSegment,
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                TextStyles.subSimpleText,
                                isActive ? styles.activeText : styles.inactiveText,
                            ]}
                        >
                            {seg.label}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#b21ae5',
    },
    segment: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
    },
    activeSegment: {
        backgroundColor: '#b21ae5',
    },
    inactiveSegment: {
        backgroundColor: 'transparent',
    },
    activeText: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    inactiveText: {
        color: '#b21ae5',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
})

export default SegmentedControl
