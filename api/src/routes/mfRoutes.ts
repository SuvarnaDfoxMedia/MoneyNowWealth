import express from "express";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import {
  addCategory,
  addMainCategory,
  deleteCategory,
  deleteMainCategory,
  getCategories,
  getCategoryByIdentifier,
  getMainCategories,
  getMainCategoryById,
  recomputeAllCategoryAverages,
  toggleCategoryStatus,
  toggleMainCategoryStatus,
  updateCategory,
  updateMainCategory,
} from "../controllers/mfCategoryController";
import {
  getAmcDeleteImpactSummary,
  getCategoryDeleteImpactSummary,
  getMainCategoryDeleteImpactSummary,
} from "../controllers/mfDeleteImpactController";
import {
  addFund,
  deleteFund,
  getPopularFunds,
  getFundById,
  getFunds,
  toggleFundStatus,
  updateFund,
} from "../controllers/mfFundController";
import {
  addNfo,
  deleteNfo,
  getNfoById,
  getNfos,
  toggleNfoStatus,
  updateNfo,
} from "../controllers/mfNfoController";
import {
  addIndexSnapshot,
  deleteIndexSnapshot,
  getIndexSnapshotById,
  getIndexSnapshots,
  toggleIndexSnapshotStatus,
  updateIndexSnapshot,
} from "../controllers/mfIndexController";
import {
  addAmc,
  deleteAmc,
  getAmcById,
  getAmcs,
  toggleAmcStatus,
  updateAmc,
} from "../controllers/mfAmcController";
import {
  addTopHolding,
  deleteTopHolding,
  getTopHoldingById,
  getTopHoldingHistory,
  getTopHoldings,
  importTopHoldings,
  toggleTopHoldingStatus,
  updateTopHolding,
} from "../controllers/mfTopHoldingController";
import {
  addBenchmark,
  getBenchmarkFilters,
  addBenchmarkReturn,
  deleteBenchmark,
  getBenchmarkById,
  getBenchmarkReturnsByFilters,
  getBenchmarkReturnsList,
  getBenchmarkReturns,
  getBenchmarks,
  updateBenchmark,
} from "../controllers/mfBenchmarkController";
import { exportExcel, importExcel } from "../controllers/mfImportController";
import { getMfDiscover, getMfFilters, getMfHome } from "../controllers/mfDiscoveryController";
import { uploadMfExcel } from "../middlewares/uploadMiddleware";
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import {
  createAmcValidators,
  createBenchmarkReturnValidators,
  createBenchmarkValidators,
  createCategoryValidators,
  createFundValidators,
  createIndexSnapshotValidators,
  createMainCategoryValidators,
  createNfoValidators,
  updateAmcValidators,
  updateBenchmarkValidators,
  updateCategoryValidators,
  updateFundValidators,
  updateIndexSnapshotValidators,
  updateMainCategoryValidators,
  updateNfoValidators,
} from "../validations/mfValidators";

const router = express.Router();
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/mf/main-categories", getMainCategories);
router.get("/mf/main-categories/:id", getMainCategoryById);

router.get("/mf/categories", getCategories);
router.get("/mf/categories/:identifier", getCategoryByIdentifier);

router.get("/mf/funds", getFunds);
router.get("/mf/funds/:id", getFundById);
router.get("/mf/popular-funds", getPopularFunds);

router.get("/mf/nfo", getNfos);
router.get("/mf/nfo/:id", getNfoById);

router.get("/mf/amcs", getAmcs);
router.get("/mf/amcs/:id", getAmcById);

router.get("/mf/index-snapshots", getIndexSnapshots);
router.get("/mf/benchmarks", getBenchmarks);
router.get("/mf/benchmarks/:id", getBenchmarkById);
router.get("/mf/benchmark-returns/:benchmarkId", getBenchmarkReturns);
router.get("/mf/top-holdings", getTopHoldings);
router.get("/mf/top-holdings/history/:schemeId", getTopHoldingHistory);
router.get("/mf/home", getMfHome);
router.get("/mf/filters", getMfFilters);
router.get("/mf/discover", getMfDiscover);

/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
router.get(
  "/:role/mf/main-categories",
  ...adminEditorMiddleware,
  getMainCategories,
);
router.get(
  "/:role/mf/main-categories/delete-impact/:id",
  ...adminEditorMiddleware,
  getMainCategoryDeleteImpactSummary,
);
router.get(
  "/:role/mf/main-categories/:id",
  ...adminEditorMiddleware,
  getMainCategoryById,
);
router.get("/:role/mf/categories", ...adminEditorMiddleware, getCategories);
router.get(
  "/:role/mf/categories/delete-impact/:id",
  ...adminEditorMiddleware,
  getCategoryDeleteImpactSummary,
);
router.get(
  "/:role/mf/categories/:identifier",
  ...adminEditorMiddleware,
  getCategoryByIdentifier,
);
router.get("/:role/mf/funds", ...adminEditorMiddleware, getFunds);
router.get("/:role/mf/funds/:id", ...adminEditorMiddleware, getFundById);
router.get("/:role/mf/nfo", ...adminEditorMiddleware, getNfos);
router.get("/:role/mf/nfo/:id", ...adminEditorMiddleware, getNfoById);
router.get("/:role/mf/amcs", ...adminEditorMiddleware, getAmcs);
router.get(
  "/:role/mf/amcs/delete-impact/:id",
  ...adminEditorMiddleware,
  getAmcDeleteImpactSummary,
);
router.get("/:role/mf/amcs/:id", ...adminEditorMiddleware, getAmcById);
router.get(
  "/:role/mf/index-snapshots",
  ...adminEditorMiddleware,
  getIndexSnapshots,
);
router.get("/:role/mf/benchmarks", ...adminEditorMiddleware, getBenchmarks);
router.get("/:role/mf/benchmarks/:id", ...adminEditorMiddleware, getBenchmarkById);
router.get("/:role/mf/benchmark/filters", ...adminEditorMiddleware, getBenchmarkFilters);
router.get("/:role/mf/benchmark/returns", ...adminEditorMiddleware, getBenchmarkReturnsByFilters);
router.get("/:role/mf/benchmark-returns", ...adminEditorMiddleware, getBenchmarkReturnsList);
router.get(
  "/:role/mf/benchmark-returns/:benchmarkId",
  ...adminEditorMiddleware,
  getBenchmarkReturns,
);
router.get(
  "/:role/mf/index-snapshots/:id",
  ...adminEditorMiddleware,
  getIndexSnapshotById,
);
router.get("/:role/mf/top-holdings", ...adminEditorMiddleware, getTopHoldings);
router.get("/:role/mf/top-holdings/history/:schemeId", ...adminEditorMiddleware, getTopHoldingHistory);
router.patch("/:role/mf/top-holdings/toggle-status/:schemeId", ...adminEditorMiddleware, toggleTopHoldingStatus);
router.post("/:role/mf/top-holdings/import", ...adminEditorMiddleware, uploadMfExcel, importTopHoldings);
router.get("/:role/mf/top-holdings/:id", ...adminEditorMiddleware, getTopHoldingById);
router.post("/:role/mf/top-holdings/create", ...adminEditorMiddleware, addTopHolding);
router.put("/:role/mf/top-holdings/edit/:id", ...adminEditorMiddleware, updateTopHolding);

/* -------------------- ADMIN CLEAN CRUD ROUTES -------------------- */
router.post(
  "/:role/mf/categories/recompute-averages",
  ...adminEditorMiddleware,
  recomputeAllCategoryAverages,
);

router.post(
  "/:role/mf/benchmark-returns",
  ...adminEditorMiddleware,
  createBenchmarkReturnValidators,
  handleValidationErrors,
  addBenchmarkReturn,
);

router.post(
  "/:role/mf/main-categories/create",
  ...adminEditorMiddleware,
  createMainCategoryValidators,
  handleValidationErrors,
  addMainCategory,
);
router.put(
  "/:role/mf/main-categories/edit/:id",
  ...adminEditorMiddleware,
  updateMainCategoryValidators,
  handleValidationErrors,
  updateMainCategory,
);
router.patch(
  "/:role/mf/main-categories/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleMainCategoryStatus,
);
router.delete(
  "/:role/mf/main-categories/delete/:id",
  ...adminEditorMiddleware,
  deleteMainCategory,
);

router.post(
  "/:role/mf/categories/create",
  ...adminEditorMiddleware,
  createCategoryValidators,
  handleValidationErrors,
  addCategory,
);
router.put(
  "/:role/mf/categories/edit/:id",
  ...adminEditorMiddleware,
  updateCategoryValidators,
  handleValidationErrors,
  updateCategory,
);
router.patch(
  "/:role/mf/categories/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleCategoryStatus,
);
router.delete(
  "/:role/mf/categories/delete/:id",
  ...adminEditorMiddleware,
  deleteCategory,
);

router.post(
  "/:role/mf/funds/create",
  ...adminEditorMiddleware,
  createFundValidators,
  handleValidationErrors,
  addFund,
);
router.put(
  "/:role/mf/funds/edit/:id",
  ...adminEditorMiddleware,
  updateFundValidators,
  handleValidationErrors,
  updateFund,
);
router.patch(
  "/:role/mf/funds/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleFundStatus,
);
router.delete(
  "/:role/mf/funds/delete/:id",
  ...adminEditorMiddleware,
  deleteFund,
);

router.post(
  "/:role/mf/nfo/create",
  ...adminEditorMiddleware,
  createNfoValidators,
  handleValidationErrors,
  addNfo,
);
router.put(
  "/:role/mf/nfo/edit/:id",
  ...adminEditorMiddleware,
  updateNfoValidators,
  handleValidationErrors,
  updateNfo,
);
router.patch(
  "/:role/mf/nfo/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleNfoStatus,
);
router.delete("/:role/mf/nfo/delete/:id", ...adminEditorMiddleware, deleteNfo);

router.post(
  "/:role/mf/index-snapshots/create",
  ...adminEditorMiddleware,
  createIndexSnapshotValidators,
  handleValidationErrors,
  addIndexSnapshot,
);
router.put(
  "/:role/mf/index-snapshots/edit/:id",
  ...adminEditorMiddleware,
  updateIndexSnapshotValidators,
  handleValidationErrors,
  updateIndexSnapshot,
);
router.patch(
  "/:role/mf/index-snapshots/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleIndexSnapshotStatus,
);
router.delete(
  "/:role/mf/index-snapshots/delete/:id",
  ...adminEditorMiddleware,
  deleteIndexSnapshot,
);

router.post(
  "/:role/mf/benchmarks/create",
  ...adminEditorMiddleware,
  createBenchmarkValidators,
  handleValidationErrors,
  addBenchmark,
);
router.put(
  "/:role/mf/benchmarks/edit/:id",
  ...adminEditorMiddleware,
  updateBenchmarkValidators,
  handleValidationErrors,
  updateBenchmark,
);
router.delete(
  "/:role/mf/benchmarks/delete/:id",
  ...adminEditorMiddleware,
  deleteBenchmark,
);

router.delete(
  "/:role/mf/top-holdings/delete/:id",
  ...adminEditorMiddleware,
  deleteTopHolding,
);

router.post(
  "/:role/mf/amcs/create",
  ...adminEditorMiddleware,
  createAmcValidators,
  handleValidationErrors,
  addAmc,
);
router.put(
  "/:role/mf/amcs/edit/:id",
  ...adminEditorMiddleware,
  updateAmcValidators,
  handleValidationErrors,
  updateAmc,
);
router.patch(
  "/:role/mf/amcs/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleAmcStatus,
);
router.delete(
  "/:role/mf/amcs/delete/:id",
  ...adminEditorMiddleware,
  deleteAmc,
);

router.post(
  "/:role/mf/import/excel",
  ...adminEditorMiddleware,
  uploadMfExcel,
  importExcel,
);
router.get(
  "/:role/mf/export/excel",
  ...adminEditorMiddleware,
  exportExcel,
);

export default router;
