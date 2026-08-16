import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'linkmeu_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites]);

  const addFavorite = useCallback((listingId) => {
    setFavorites((prev) => {
      if (prev.includes(listingId)) return prev;
      return [...prev, listingId];
    });
  }, []);

  const removeFavorite = useCallback((listingId) => {
    setFavorites((prev) => prev.filter((id) => id !== listingId));
  }, []);

  const toggleFavorite = useCallback((listingId) => {
    setFavorites((prev) => {
      if (prev.includes(listingId)) {
        return prev.filter((id) => id !== listingId);
      }
      return [...prev, listingId];
    });
  }, []);

  const isFavorite = useCallback((listingId) => {
    return favorites.includes(listingId);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length,
  };
};

export default useFavorites;
