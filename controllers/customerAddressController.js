const customerAddressService = require("../services/customerAddressService");
const { Pincode } = require("../models");
const logger = require("../utils/logger");

exports.createAddress = async (req, res) => {
  const userId = req.user.id;
  const pinCode = req.body.pinCode;
  try {
    const data = await Pincode.findOne({
      where: {
        pinCode,
      },
    });
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid pincode" });
    }

    const addressData = {
      ...req.body,
      district: data.district,
      state: data.state,
      userId,
      country: "India",
    }; // Add userId and default country

    const address = await customerAddressService.createAddress(addressData);
    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    logger.error("Error while adding customer address", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: error.message,
    });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await customerAddressService.getAddressesByUserId(userId);

    return res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    logger.error("Error while fetching customer addresses", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await customerAddressService.getAddressById(id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    return res.status(200).json({ success: true, data: address });
  } catch (error) {
    logger.error("Error while fetching customer address by id", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch address",
      error: error.message,
    });
  }
};

exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const pinCode = req.body.pinCode;
  try {
    const data = await Pincode.findOne({
      where: {
        pinCode,
      },
    });
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid pincode" });
    }

    const address = await customerAddressService.updateAddress(id, userId, {
      ...req.body,
      district: data.district,
      state: data.state,
    });

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    logger.error("Error while updating customer address", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await customerAddressService.deleteAddress(id, userId);

    return res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    logger.error("Error while deleting customer address", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.selectAddress = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user.id;
    const address = await customerAddressService.selectAddress(id, userId);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Address selected successfully",
      data: address,
    });
  } catch (error) {
    logger.error("Error while selecting customer address", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to select address",
      error: error.message,
    });
  }
};
