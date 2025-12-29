"use strict";
import { AppDataSource } from "../config/configDb.js";
import Region from "../entity/region.entity.js";
import Comuna from "../entity/comuna.entity.js";

export async function getRegions(req, res) {
  try {
    const regionRepo = AppDataSource.getRepository(Region);
    const regions = await regionRepo.find({
      order: { id: "ASC" }
    });
    res.json(regions);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener regiones", error: error.message });
  }
}

export async function getComunasByRegion(req, res) {
  try {
    const { regionId } = req.params;
    const comunaRepo = AppDataSource.getRepository(Comuna);
    
    const comunas = await comunaRepo.find({
      where: { region: { id: parseInt(regionId) } },
      order: { name: "ASC" }
    });
    
    res.json(comunas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener comunas", error: error.message });
  }
}