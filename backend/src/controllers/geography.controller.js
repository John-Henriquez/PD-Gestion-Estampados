"use strict";
import { handleSuccess, handleErrorServer } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import Region from "../entity/region.entity.js";
import Comuna from "../entity/comuna.entity.js";

export async function getRegions(req, res) {
  try {
    const regionRepo = AppDataSource.getRepository(Region);
    const regions = await regionRepo.find({
      order: { id: "ASC" }
    });
    handleSuccess(res, 200, "Regiones obtenidas", regions);
  } catch (error) {
    handleErrorServer(res, 500, error.message); 
  }
}

export async function getComunasByRegion(req, res) {
  try {
    const { regionId } = req.params;
    const comunaRepo = AppDataSource.getRepository(Comuna);

    const parsed = parseInt(regionId);
    if (isNaN(parsed)) return handleErrorClient(res, 400, "ID de región inválido");
    
    const comunas = await comunaRepo.find({
      where: { region: { id: parseInt(regionId) } },
      order: { name: "ASC" }
    });
    
    res.json(comunas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener comunas", error: error.message });
  }
}