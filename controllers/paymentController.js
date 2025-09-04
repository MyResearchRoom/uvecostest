const {
  getCompanyListWithPaymentData,
  getStoreListWithPaymentData,
  getPlatformToCompanyTransactions,
  getCompanyToStoreTransactions,
  getPlatformPaymentStats,
  getStorePaymentStats,
  getCompanyPaymentStats,
  payToCompany,
} = require("../services/paymentService");
const { validateQueryParams } = require("../utils/validateQueryParams");

exports.getCompanyListWithPaymentData = async (req, res) => {
  try {
    const { limit, page, searchTerm } = validateQueryParams({ ...req.query });
    const data = await getCompanyListWithPaymentData({
      limit,
      page,
      searchTerm,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStoreListWithPaymentData = async (req, res) => {
  try {
    const { limit, page, searchTerm } = validateQueryParams({ ...req.query });
    const data = await getStoreListWithPaymentData({
      limit,
      page,
      searchTerm,
      companyId: req.user.companyId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPlatformToCompanyTransactions = async (req, res) => {
  try {
    const { limit, page } = validateQueryParams({ ...req.query });
    const data = await getPlatformToCompanyTransactions({
      limit,
      page,
      companyId: req.params.companyId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyToStoreTransactions = async (req, res) => {
  try {
    const { limit, page } = validateQueryParams({ ...req.query });
    const data = await getCompanyToStoreTransactions({
      limit,
      page,
      storeId: req.params.storeId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getstoreTransactions = async (req, res) => {
  try {
    const { limit, page } = validateQueryParams({ ...req.query });
    const data = await getCompanyToStoreTransactions({
      limit,
      page,
      storeId: req.user.id,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPlatformPaymentStats = async (req, res) => {
  try {
    const data = await getPlatformPaymentStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyPaymentStats = async (req, res) => {
  try {
    const data = await getCompanyPaymentStats(req.user.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStorePaymentStats = async (req, res) => {
  try {
    const data = await getStorePaymentStats(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.payToCompany = async (req, res) => {
  try {
    const { companyId, amount } = req.body;
    const data = await payToCompany(companyId, amount);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
