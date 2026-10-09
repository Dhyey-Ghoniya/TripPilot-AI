import { useState, useEffect, useCallback } from 'react';
import destinationService from '../services/destinationService';

export const useDestinations = (initialParams = {}) => {
  const [destinations, setDestinations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDestinations = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await destinationService.getDestinations(params);
      if (response && response.success && response.data) {
        setDestinations(response.data.destinations || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError(response?.message || 'Failed to fetch destinations');
      }
    } catch (err) {
      setError(err.customMessage || err.message || 'Error fetching destinations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations(initialParams);
  }, [fetchDestinations]);

  return {
    destinations,
    pagination,
    isLoading,
    error,
    refetch: fetchDestinations,
  };
};

export default useDestinations;
