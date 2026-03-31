import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CardCondition } from '../types';
import { CONDITIONS } from '../constants/config';

interface ConditionPickerProps {
  value: CardCondition;
  onChange: (c: CardCondition) => void;
  compact?: boolean;
}

const ConditionPicker: React.FC<ConditionPickerProps> = ({ value, onChange, compact = false }) => {
  return (
    <View style={styles.container}>
      {CONDITIONS.map((condition) => {
        const isSelected = condition === value;
        return (
          <Pressable
            key={condition}
            onPress={() => onChange(condition)}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              isSelected && styles.chipSelected,
            ]}
            accessibilityLabel={`Condition ${condition}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.chipText,
                compact && styles.chipTextCompact,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {condition}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  chipCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipSelected: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  chipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chipTextCompact: {
    fontSize: 11,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});

export default ConditionPicker;
