// ============================================================
// Region Controller & Upload Controller
// - Region: mengambil daftar Provinsi & Kota dari Emsifa Service
// - Upload: menghasilkan signature Cloudinary untuk upload gambar
// ============================================================
import {
  getProvincesService,
  getCitiesByProvinceService,
} from "../services/region.service.js";
import { createCloudinaryUploadSignature } from "../services/cloudinary.service.js";

export async function getProvincesController() {
  const provinces = await getProvincesService();
  return {
    success: true,
    statusCode: 200,
    data: provinces,
  };
}

export async function getCitiesController(provinceId: string) {
  if (!provinceId) {
    return {
      success: false,
      statusCode: 400,
      message: "Parameter provinceId wajib diisi",
    };
  }
  const cities = await getCitiesByProvinceService(provinceId);
  return {
    success: true,
    statusCode: 200,
    data: cities,
  };
}

export function getCloudinarySignatureController(folder?: string) {
  const sig = createCloudinaryUploadSignature(folder);
  return {
    success: true,
    statusCode: 200,
    data: sig,
  };
}
