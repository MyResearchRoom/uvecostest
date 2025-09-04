const cron = require("node-cron");
const {
  OrderProduct,
  OrderItem,
  PlatformToCompany,
  CompanyToStore,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const settlePayments = async () => {
  const transaction = await sequelize.transaction();
  try {
    const orderProducts = await OrderProduct.findAll({
      attributes: ["id", "price", "quantity", "returnQuantity"],
      where: {
        isSettled: false,
        isCancel: false,
        returnDate: {
          [Op.lte]: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id", "deliveredAt", "storeId", "companyId"],
          where: {
            deliveredAt: {
              [Op.ne]: null,
            },
          },
        },
      ],
    });

    const companyMap = new Map();
    const storeMap = new Map();

    for (const orderProduct of orderProducts) {
      const companyId = orderProduct.orderItem.companyId;
      const storeId = orderProduct.orderItem.storeId;
      const netAmount =
        orderProduct.price *
        (orderProduct.quantity - orderProduct.returnQuantity);

      companyMap.set(companyId, (companyMap.get(companyId) || 0) + netAmount);

      if (storeId) {
        const storeKey = `${companyId}-${storeId}`;
        storeMap.set(storeKey, (storeMap.get(storeKey) || 0) + netAmount);
      }
    }

    for (const [companyId, amount] of companyMap.entries()) {
      const record = await PlatformToCompany.findOne({
        where: { companyId },
      });

      if (!record) {
        await PlatformToCompany.create(
          { companyId, totalAmount: amount },
          { transaction }
        );
      } else {
        await PlatformToCompany.increment(
          { totalAmount: amount },
          { where: { companyId }, transaction }
        );
      }
    }

    for (const [key, amount] of storeMap.entries()) {
      const [companyId, storeId] = key.split("-");
      const record = await CompanyToStore.findOne({
        where: { companyId, storeId },
        transaction,
      });

      if (!record) {
        await CompanyToStore.create(
          { companyId, storeId, totalAmount: amount },
          { transaction }
        );
      } else {
        await CompanyToStore.increment(
          { totalAmount: amount },
          { where: { companyId, storeId }, transaction }
        );
      }
    }

    await OrderProduct.update(
      { isSettled: true },
      {
        where: {
          id: { [Op.in]: orderProducts.map((item) => item.id) },
        },
        transaction,
      }
    );

    await transaction.commit();

    console.log("Payments settled successfully");
  } catch (error) {
    await transaction.rollback();
    console.error("Settlement Error:", error);
  }
};

module.exports = () => {
  cron.schedule("0 0 * * *", settlePayments, {
    timezone: "Asia/Kolkata",
  });
};
