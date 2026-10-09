import { useState, useEffect, useCallback } from 'react';
import attractionService from '../services/attractionService';

export const useAttractions = (initialParams = {}) => {
  const [attractions, setAttractions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchAttractions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await attractionService.getAttractions(params);
      if (res.success && res.data) {
        setAttractions(res.data.attractions || []);
        setPagination(res.data.pagination || {});
      }
    } catch (err) {
      console.error('Error fetching attractions:', err);
      setError(err.response?.data?.message || 'Failed to load attractions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  const updateFilters = (newFilters) => {
    setParams((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1, // Reset page on filter change
    }));
  };

  return {
    attractions,
    pagination,
    loading,
    error,
    params,
    setParams,
    updateFilters,
    refetch: fetchAttractions,
  };
};

export default useAttractions;
