// src/components/CustomChart.tsx
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

interface CustomChartProps {
    data: number[];
    labels: string[];
}

const CustomChart: React.FC<CustomChartProps> = ({ data, labels }) => {
    return (
        <View style={styles.chartWrapper}>
            <LineChart
                data={{
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                        },
                    ],
                }}
                width={screenWidth - 32} // prendre en compte la marge horizontale
                height={220}
                yAxisSuffix=" kg"
                chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(178, 26, 229, ${opacity})`, // violet FlexFit
                    labelColor: (opacity = 1) => `rgba(20, 18, 23, ${opacity})`,
                    style: {
                        borderRadius: 16,
                    },
                    propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#b21ae5",
                    },
                }}
                bezier
                style={styles.chartStyle}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    chartWrapper: {
        marginVertical: 16,
        borderRadius: 16,
        backgroundColor: '#F8F8F8',
        padding: 8,
    },
    chartStyle: {
        borderRadius: 16,
    },
});

export default CustomChart;
