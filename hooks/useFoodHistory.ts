import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodSuggestion } from './useOpenFoodFacts';

const HISTORY_KEY = '@supershopper/food_history';
const MAX_HISTORY = 8;

export function useFoodHistory() {
  const [history, setHistory] = useState<FoodSuggestion[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try { setHistory(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const addToHistory = useCallback((item: FoodSuggestion) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => h.name.toLowerCase() !== item.name.toLowerCase(),
      );
      const next = [item, ...filtered].slice(0, MAX_HISTORY);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, addToHistory };
}
