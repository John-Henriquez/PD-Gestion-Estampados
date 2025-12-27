import { reportService } from "../services/report.service.js";
import { handleSuccess, handleErrorServer } from "../handlers/responseHandlers.js";

export const reportController = {
  async getDashboardStats(req, res) {
    try {
      const [stats, error] = await reportService.getDashboardStats();
      if (error) return handleErrorServer(res, 500, error);
      
      handleSuccess(res, 200, "Estadísticas obtenidas", stats);
    } catch (error) {
      handleErrorServer(res, 500, "Error interno al procesar reportes");
    }
  },
  async getInventoryLossReport(req, res) {
    try {
      const [lossSummary, error] = await reportService.getInventoryLossReport();
      if (error) return handleErrorServer(res, 500, error);
      
      handleSuccess(res, 200, "Resumen de pérdidas obtenido", lossSummary);
    } catch (error) {
      handleErrorServer(res, 500, "Error interno al procesar reportes");
    }
  }
};