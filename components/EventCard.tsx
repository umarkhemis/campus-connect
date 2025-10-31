
// components/EventCard.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  rsvped: boolean;
  onToggleRSVP: () => void;
}

const EventCard = ({ title, location, start_time, end_time, rsvped, onToggleRSVP }: Props) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text>{location}</Text>
    <Text>{new Date(start_time).toLocaleString()} → {new Date(end_time).toLocaleString()}</Text>
    <Button title={rsvped ? "Cancel RSVP" : "RSVP"} onPress={onToggleRSVP} />
  </View>
);

const styles = StyleSheet.create({
  card: { margin: 10, padding: 10, borderWidth: 1, borderRadius: 6 },
  title: { fontWeight: 'bold', fontSize: 16 },
});

export default EventCard;
