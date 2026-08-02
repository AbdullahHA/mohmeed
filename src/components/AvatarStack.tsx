import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';
import type { Friend } from '../data/trips';

type Props = {
  friends: Friend[];
  size?: number;
};

export default function AvatarStack({ friends, size = 34 }: Props) {
  return (
    <View style={styles.row}>
      {friends.map((friend, index) => (
        <View
          key={friend.id}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginRight: index === 0 ? 0 : -size * 0.3,
            },
          ]}
        >
          <Text style={styles.initial}>{friend.initial}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.sand,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
