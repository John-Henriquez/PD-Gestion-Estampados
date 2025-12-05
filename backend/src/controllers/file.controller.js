import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import archiver from "archiver";
import { AppDataSource } from "../config/configDb.js";
import ItemType from "../entity/itemType.entity.js";
import OrderItem from "../entity/orderItem.entity.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { Like } from "typeorm";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export const fileController = {
    // 1. Obtener galería clasificada
  async getGallery(req, res) {
    try {
      if (!existsSync(UPLOADS_DIR)) {
        await fs.mkdir(UPLOADS_DIR);
      }

      const files = await fs.readdir(UPLOADS_DIR);
      
      const itemTypeRepo = AppDataSource.getRepository(ItemType);
      const orderItemRepo = AppDataSource.getRepository(OrderItem);

      const itemTypes = await itemTypeRepo.find({ select: ["productImageUrls"] });
      const orderItems = await orderItemRepo.find({ select: ["stampImageUrl", "order"], relations: ["order"] });

      const inventoryImages = new Set();
      itemTypes.forEach(it => {
        if (Array.isArray(it.productImageUrls)) {
          it.productImageUrls.forEach(url => inventoryImages.add(path.basename(url)));
        }
      });

      const orderImages = new Map();
      orderItems.forEach(oi => {
        if (oi.stampImageUrl) {
          orderImages.set(path.basename(oi.stampImageUrl), oi.order?.id);
        }
      });

      const gallery = await Promise.all(files.map(async (filename) => {
        if (filename.startsWith(".")) return null;

        try {
          const stats = await fs.stat(path.join(UPLOADS_DIR, filename));
          
          let category = "uncategorized";
          let relatedId = null;

          if (inventoryImages.has(filename)) {
            category = "inventory";
          } else if (orderImages.has(filename)) {
            category = "order";
            relatedId = orderImages.get(filename);
          }

          return {
            filename,
            url: `/uploads/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime,
            category,
            relatedId
          };
        } catch (err) {
          return null; 
        }
      }));

      const cleanGallery = gallery.filter(item => item !== null);

      handleSuccess(res, 200, "Galería obtenida", cleanGallery);
    } catch (error) {
      console.error("Error en getGallery:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  // 2. Eliminar archivo
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      // Seguridad básica para evitar Path Traversal
      const safeFilename = path.basename(filename);
      const filepath = path.join(UPLOADS_DIR, safeFilename);

      await fs.unlink(filepath);
      handleSuccess(res, 200, "Archivo eliminado correctamente");
    } catch (error) {
      if (error.code === "ENOENT") {
        return handleErrorClient(res, 404, "Archivo no encontrado");
      }
      handleErrorServer(res, 500, error.message);
    }
  },

  // 3. Renombrar archivo
async renameFile(req, res) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let fileRenamed = false;
    const { oldName, newName } = req.body;
    
    const safeOld = path.basename(oldName);
    let safeNew = path.basename(newName); 
    
    const originalExt = path.extname(safeOld);
    if (!safeNew.toLowerCase().endsWith(originalExt.toLowerCase())) {
        const newExt = path.extname(safeNew);
        if (newExt) {
            safeNew = safeNew.slice(0, -newExt.length); 
        }
        safeNew += originalExt;
    }

    const oldPath = path.join(UPLOADS_DIR, safeOld);
    const newPath = path.join(UPLOADS_DIR, safeNew);

    try {
      if (!safeOld || !safeNew) throw new Error("Nombres inválidos");
      
      if (safeOld === safeNew) {
          const error = new Error("El nuevo nombre es idéntico al actual");
          error.code = "IDENTICAL_NAME";
          throw error;
      }

      try {
        await fs.access(oldPath);
      } catch {
        const error = new Error("El archivo original no existe en el disco");
        error.code = "FILE_NOT_FOUND";
        throw error;
      }

      try {
        await fs.access(newPath);
        const error = new Error("Ya existe un archivo con el nuevo nombre");
        error.code = "FILE_EXISTS";
        throw error;
      } catch (e) {
        if (e.code === "FILE_EXISTS") throw e;
      }

      await fs.rename(oldPath, newPath);
      fileRenamed = true; 

      const itemTypes = await queryRunner.manager.getRepository(ItemType).find({
        where: { productImageUrls: Like(`%${safeOld}%`) }
      });

      for (const item of itemTypes) {
        if (Array.isArray(item.productImageUrls)) {
          let changed = false;
          const newUrls = item.productImageUrls.map(url => {
            if (url.endsWith(safeOld)) {
                changed = true;
                return url.replace(safeOld, safeNew);
            }
            return url;
          });
          
          if (changed) {
            item.productImageUrls = newUrls;
            await queryRunner.manager.save(ItemType, item);
          }
        }
      }

      const orderItems = await queryRunner.manager.getRepository(OrderItem).find({
        where: { stampImageUrl: Like(`%${safeOld}%`) }
      });

      for (const orderItem of orderItems) {
        if (orderItem.stampImageUrl && orderItem.stampImageUrl.endsWith(safeOld)) {
          orderItem.stampImageUrl = orderItem.stampImageUrl.replace(safeOld, safeNew);
          await queryRunner.manager.save(OrderItem, orderItem);
        }
      }

      await queryRunner.commitTransaction();

      handleSuccess(res, 200, "Archivo renombrado correctamente", { old: safeOld, new: safeNew });

    } catch (error) {-
      await queryRunner.rollbackTransaction();
      
      if (fileRenamed) {
        try {
          await fs.rename(newPath, oldPath);
          console.log(`[Rollback] Archivo restaurado a ${safeOld}`);
        } catch (fsError) {
          console.error(`[CRÍTICO] No se pudo restaurar el archivo ${safeNew} a ${safeOld}:`, fsError);
        }
      }
      
      console.error("Error renombrando archivo:", error);
      let statusCode = 500;
      if (
          error.code === "IDENTICAL_NAME" ||
          error.code === "FILE_EXISTS" ||
          error.message.includes("Nombres inválidos")
        ) {
          statusCode = 400;
      } else if (error.code === "FILE_NOT_FOUND") {
          statusCode = 404;
      }

      handleErrorClient(res, statusCode, error.message);
    } finally {
      await queryRunner.release();
    }
  },

  // 4. Descargar ZIP por Pedido
  async downloadOrderImages(req, res) {
    try {
      const { orderId } = req.params;
      const orderItemRepo = AppDataSource.getRepository(OrderItem);
      
      const items = await orderItemRepo.find({
        where: { order: { id: parseInt(orderId) } }
      });

      const imagesToZip = items
        .filter(item => item.stampImageUrl)
        .map(item => path.basename(item.stampImageUrl));

      if (imagesToZip.length === 0) {
        return handleErrorClient(res, 404, "Este pedido no tiene imágenes de estampado");
      }

      res.attachment(`pedido_${orderId}_imagenes.zip`);
      
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("error", (err) => {
        console.error("Error en archiver:", err);
        if (!res.headersSent) handleErrorServer(res, 500, "Error comprimiendo archivos");
      });

      archive.pipe(res);

      for (const filename of imagesToZip) {
        const filepath = path.join(UPLOADS_DIR, filename);
        if (existsSync(filepath)) {
            archive.file(filepath, { name: filename });
        }
      }

      await archive.finalize();

    } catch (error) {
      console.error("Error downloadOrderImages:", error);
      if (!res.headersSent) handleErrorServer(res, 500, error.message);
    }
  }
};