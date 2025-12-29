import { useState, useEffect } from 'react';
import { getRegions, getComunas } from '../services/geography.service';

export const useGeography = () => {
  console.log("!!! EL HOOK ESTÁ VIVO !!!");
  const [regions, setRegions] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingComunas, setLoadingComunas] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoadingRegions(true);
        const data = await getRegions();
        setRegions(data);
      } catch (err) {
        setError("No se pudieron cargar las regiones");
        console.error(err);
      } finally {
        setLoadingRegions(false);
      }
    };
    fetchRegions();
  }, []);

  const fetchComunas = async (regionId) => {
    if (!regionId) {
      setComunas([]);
      return;
    }
    try {
      setLoadingComunas(true);
      const data = await getComunas(regionId);
      setComunas(data);
    } catch (err) {
      setError("No se pudieron cargar las comunas");
      console.error(err);
    } finally {
      setLoadingComunas(false);
    }
  };

  return {
    regions,
    comunas,
    loadingRegions,
    loadingComunas,
    fetchComunas,
    error,
    setComunas 
  };
};