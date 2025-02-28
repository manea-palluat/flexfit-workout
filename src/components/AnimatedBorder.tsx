import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface AnimatedBorderProps { //props du composant
    isActive: boolean; //animation active ou pas
}

const AnimatedBorder: React.FC<AnimatedBorderProps> = ({ isActive }) => { //composant border animé
    const rotateAnim = useRef(new Animated.Value(0)).current; //déclare valeur animée pour rotation

    //GESTION DE L'ANIMATION
    useEffect(() => {
        if (isActive) { //si actif, lance l'animation en loop
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else { //sinon remet la valeur à 0
            rotateAnim.setValue(0);
        }
    }, [isActive, rotateAnim]);

    if (!isActive) return null; //retourne null si animation désactivée

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    }); //crée une interpolation pour la rotation

    //nombre de segments et longueur (deg) de chaque segment
    const segments = 50; //nb de segments
    const segmentLength = 180; //longueur en deg pour le calcul

    //SEGMENTS
    return (
        <View style={styles.borderContainer}>
            {Array.from({ length: segments }).map((_, i) => {
                const segmentOpacity = 1 - i / segments; //opacité du segment
                const segmentRotation = (i * segmentLength) / segments; //rotation calculée du segment

                return (
                    <>
                        {/* segment animé de la bordure */}
                        <Animated.View
                            key={i}
                            style={[
                                styles.borderSegment,
                                {
                                    opacity: segmentOpacity,
                                    transform: [
                                        { rotate: `${segmentRotation}deg` }, //rotation de base du segment
                                        { translateX: 41 }, //décalage horizontal pour positionner le segment
                                        { rotate }, //applique la rotation animée globale
                                    ],
                                },
                            ]}
                        />
                    </>
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
