import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface AnimatedBorderProps {
    isActive: boolean;
}

const AnimatedBorder: React.FC<AnimatedBorderProps> = ({ isActive }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotateAnim.setValue(0);
        }
    }, [isActive, rotateAnim]);

    if (!isActive) return null;

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Number of segments and their length (in degrees) along the border
    const segments = 50;
    const segmentLength = 180;

    return (
        <View style={styles.borderContainer}>
            {Array.from({ length: segments }).map((_, i) => {
                const segmentOpacity = 1 - i / segments;
                const segmentRotation = (i * segmentLength) / segments;

                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.borderSegment,
                            {
                                opacity: segmentOpacity,
                                transform: [
                                    { rotate: `${segmentRotation}deg` },
                                    { translateX: 41 },
                                    { rotate },
                                ],
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    borderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    borderSegment: {
        position: 'absolute',
        width: 2,
        height: 20,
        backgroundColor: 'black',
    },
});

export default AnimatedBorder;
