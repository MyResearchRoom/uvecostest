const { Op } = require("sequelize");
const {
  Product,
  Pricerule,
  Store,
  Distributor,
  sequelize,
} = require("../models");
const logger = require("../utils/logger");

exports.addPricerule = async (req, res, next) => {
  const { name, products } = req.body;

  const transaction = await sequelize.transaction();
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid products array" });
    }

    // Prepare data for bulk creation
    const priceRuleData = await Promise.all(
      products.map(async (product) => {
        const isExists = await Pricerule.findOne({
          where: {
            name,
            // priceValue: product.priceValue,
            productId: product.id,
            companyId: req.user.companyId,
          },
        });

        if (!isExists) {
          return {
            name,
            priceValue: product.priceValue,
            productId: product.id,
            companyId: req.user.companyId,
          };
        }

        return null;
      })
    );

    // Filter out `null` values from the resulting array
    const filteredPriceRuleData = priceRuleData.filter((data) => data !== null);

    // Bulk create assigned rules
    await Pricerule.bulkCreate(filteredPriceRuleData, { transaction });

    // Commit the transaction
    await transaction.commit();

    logger.info("A new pricerule has been created", {
      actionBy: req.user.id,
      priceRuleName: name,
    });

    return res.status(201).json({
      success: true,
      message: "Price rule created successfully",
      data: priceRuleData,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while creating pricerule", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Failed to add pricerule",
      success: false,
    });
  }
};

exports.editPriceRule = async (req, res, next) => {
  const { name, products } = req.body;

  const transaction = await sequelize.transaction();
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid products array" });
    }

    // Prepare data for bulk creation
    const priceRuleData = await Promise.all(
      products.map(async (product) => {
        const isExists = await Pricerule.findOne({
          where: {
            name,
            productId: product.id,
            companyId: req.user.companyId,
            // priceValue: product.priceValue,
          },
        });

        if (!isExists) {
          return {
            name,
            priceValue: product.priceValue,
            productId: product.id,
            companyId: req.user.companyId,
          };
        } else {
          await Pricerule.update(
            { priceValue: product.priceValue },
            {
              where: {
                name,
                productId: product.id,
                companyId: req.user.companyId,
              },
              transaction,
            }
          );
        }

        return null;
      })
    );

    // Filter out `null` values from the resulting array
    const filteredPriceRuleData = priceRuleData.filter((data) => data !== null);

    // Bulk create assigned rules
    await Pricerule.bulkCreate(filteredPriceRuleData, { transaction });

    // Commit the transaction
    await transaction.commit();

    logger.info("A pricerule has been updated", {
      actionBy: req.user.id,
      priceRuleName: name,
    });

    return res.status(200).json({
      success: true,
      message: "Price rule updated successfully",
      data: priceRuleData,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while updating pricerule", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to add pricerule",
    });
  }
};

exports.deleteProductFromPriceRule = async (req, res) => {
  const { name, productId } = req.body;
  try {
    await Pricerule.destroy({
      where: {
        name,
        productId: productId,
      },
    });

    logger.info("A product has been remove from pricerule.", {
      actionBy: req.user.id,
      priceRuleName: name,
      productId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Product deleted from pricerule" });
  } catch (error) {
    logger.error("Error while deleting pricerule", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: " Failed to delete product from pricerule",
    });
  }
};

exports.getPricerulesWithProductCount = async (req, res) => {
  const { searchTerm } = req.query;
  const companyId = req.user.companyId;

  const whereClause = { companyId };
  if (searchTerm !== undefined && searchTerm !== null && searchTerm !== "") {
    whereClause.name = {
      [Op.like]: `%${searchTerm}%`,
    };
  }

  try {
    // Fetch all price rules with product counts
    const pricerules = await Pricerule.findAll({
      where: whereClause,
      attributes: [
        "name",
        [sequelize.fn("COUNT", sequelize.col("productId")), "productCount"],
      ],
      group: ["name"],
    });

    return res.status(200).json({
      success: true,
      message: "Price rules retrieved successfully",
      data: pricerules,
    });
  } catch (error) {
    logger.error("Error while fetching pricerules", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: error.message || "Failed to retrieve price rules",
    });
  }
};

exports.getProductsByRuleName = async (req, res) => {
  const ruleName = req.body.name;
  const searchTerm = req.query.searchTerm;
  const whereClause = {};
  if (searchTerm !== "" && searchTerm !== undefined && searchTerm !== null) {
    whereClause.productName = {
      [Op.like]: `%${searchTerm}%`,
    };
  }
  try {
    // Fetch pricerules along with associated products based on rule name
    const pricerules = await Pricerule.findAll({
      where: { name: ruleName, companyId: req.user.companyId },
      include: [
        {
          model: Product,
          as: "product", // Ensure this alias matches your association definition
          attributes: [
            "id",
            "productName",
            "originalPrice",
            "gst",
            [
              sequelize.literal("`Pricerule`.`priceValue`"), // Properly reference the priceValue column
              "priceValue",
            ],
            [
              sequelize.literal(
                "ROUND((`product`.`originalPrice` + (`product`.`originalPrice` * `product`.`gst` / 100)) * (1 - `Pricerule`.`priceValue` / 100), 2)"
              ),
              "totalAmount", // Total amount after applying priceValue discount
            ],
          ],
          where: whereClause,
        },
      ],
    });

    // Extract and format the associated product data
    const formattedProducts = pricerules.flatMap((rule) => rule.product);

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: formattedProducts,
    });
  } catch (error) {
    logger.error("Error while getting pricerule products", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Failed to retrieve products by rule name",
      success: false,
    });
  }
};

exports.deletePriceRule = async (req, res, next) => {
  const name = req.body.name;
  try {
    await Pricerule.destroy({
      where: {
        name,
        companyId: req.user.companyId,
      },
    });

    logger.info("A pricerule has been deleted", {
      actionBy: req.user.id,
      priceruleName: name,
    });

    return res
      .status(200)
      .json({ success: true, message: "Price rule deleted successfully" });
  } catch (error) {
    logger.error("Error while deleting pricerule", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete price rule" });
  }
};

exports.assignedPricerulesToStore = async (req, res, next) => {
  const { name } = req.body;
  const { storeId } = req.params;

  try {
    const pricerule = await Pricerule.findOne({
      where: {
        name,
        companyId: req.user.companyId,
      },
    });

    if (!pricerule) {
      return res
        .status(404)
        .json({ success: false, message: "Price rule not found" });
    }

    await Store.update(
      { priceRule: name },
      {
        where: {
          id: storeId,
        },
      }
    );

    logger.info("A pricerule has been assigned to store.", {
      actionBy: req.user.id,
      priceruleName: name,
      storeId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Price rule assigned successfully" });
  } catch (error) {
    logger.error("Error while assigning pricerule to store", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to assign price rule to store",
    });
  }
};

exports.assignedPricerulesToDistributor = async (req, res, next) => {
  const { name } = req.body;
  const { distributorId } = req.params;

  try {
    const pricerule = await Pricerule.findOne({
      where: {
        name,
        companyId: req.user.companyId,
      },
    });

    if (!pricerule) {
      return res
        .status(404)
        .json({ success: false, message: "Price rule not found" });
    }

    await Distributor.update(
      { priceRule: name },
      {
        where: {
          id: distributorId,
        },
      }
    );

    logger.info("A pricerule is assigned to distributor.", {
      actionBy: req.user.id,
      priceruleName: name,
      distributorId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Price rule assigned successfully" });
  } catch (error) {
    logger.error("Error while assigning pricerule to distributor", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to assign price rule to store",
    });
  }
};
