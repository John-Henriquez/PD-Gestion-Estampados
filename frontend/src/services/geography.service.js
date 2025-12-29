"use strict";
import axios from './root.service.js'; 

export const getRegions = async () => {
  try {
    const response = await axios.get('/geography/regions');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getComunas = async (regionId) => {
  try {
    const response = await axios.get(`/geography/comunas/${regionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
