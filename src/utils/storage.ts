import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanSession } from '../types';

const SESSIONS_KEY = 'sessions';
const CURRENT_SESSION_KEY = 'current_session';

export async function saveSessions(sessions: ScanSession[]): Promise<void> {
  try {
    const json = JSON.stringify(sessions);
    await AsyncStorage.setItem(SESSIONS_KEY, json);
  } catch (error) {
    console.error('Failed to save sessions:', error);
    throw error;
  }
}

export async function loadSessions(): Promise<ScanSession[]> {
  try {
    const json = await AsyncStorage.getItem(SESSIONS_KEY);
    if (json === null) {
      return [];
    }
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as ScanSession[];
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
}

export async function saveCurrentSession(session: ScanSession | null): Promise<void> {
  try {
    if (session === null) {
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
    } else {
      const json = JSON.stringify(session);
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, json);
    }
  } catch (error) {
    console.error('Failed to save current session:', error);
    throw error;
  }
}

export async function loadCurrentSession(): Promise<ScanSession | null> {
  try {
    const json = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    if (json === null) {
      return null;
    }
    return JSON.parse(json) as ScanSession;
  } catch (error) {
    console.error('Failed to load current session:', error);
    return null;
  }
}
