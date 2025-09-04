const { Op } = require("sequelize");
const {
  User,
  Company,
  Store,
  PlatformToCompany,
  CompanyToStore,
  PlatformToCompanyTransaction,
  CompanyToStoreTransaction,
  sequelize,
} = require("../models");

exports.getCompanyListWithPaymentData = async ({
  page = 1,
  limit = 10,
  searchTerm = "",
}) => {
  try {
    const offset = (page - 1) * limit;

    const whereClause = {
      totalAmount: {
        [Op.gt]: 0,
      },
    };
    if (searchTerm) {
      whereClause["$company.companyName$"] = {
        [Op.like]: `%${searchTerm}%`,
      };
    }
    const { rows, count } = await PlatformToCompany.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: "company",
          attributes: ["id", "companyName"],
        },
      ],
      limit,
      offset,
    });
    return {
      data: rows.map((comp) => ({
        companyId: comp.company.id,
        companyName: comp.company.companyName,
        totalAmount: comp.totalAmount,
        paidAmount: comp.paidAmount,
        pendingAmount: comp.totalAmount - comp.paidAmount,
      })),
      pagination: {
        totalRecords: parseInt(count),
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getStoreListWithPaymentData = async ({
  page = 1,
  limit = 10,
  searchTerm = "",
  companyId,
}) => {
  try {
    const offset = (page - 1) * limit;

    const whereClause = { companyId, totalAmount: { [Op.gt]: 0 } };
    if (searchTerm) {
      whereClause["$store.name$"] = {
        [Op.like]: `%${searchTerm}%`,
      };
    }
    const { rows, count } = await CompanyToStore.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "store",
          include: [
            {
              model: Store,
              as: "store",
              attributes: ["storeType"],
            },
          ],
        },
      ],
      limit,
      offset,
    });
    return {
      data: rows.map((item) => ({
        storeId: item.storeId,
        name: item.store.name,
        storeType: item.store.store.storeType,
        totalAmount: item.totalAmount,
        paidAmount: item.paidAmount,
        pendingAmount: item.totalAmount - item.paidAmount,
      })),
      pagination: {
        totalRecords: parseInt(count),
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getPlatformToCompanyTransactions = async ({
  companyId,
  page,
  limit,
}) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await PlatformToCompanyTransaction.findAndCountAll({
    where: {
      companyId,
    },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    pagination: {
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    },
  };
};

exports.getCompanyToStoreTransactions = async ({ storeId, limit, page }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await CompanyToStoreTransaction.findAndCountAll({
    where: {
      storeId,
    },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    pagination: {
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    },
  };
};

exports.getPlatformPaymentStats = async () => {
  const [totalAmount, paidAmount] = await Promise.all([
    PlatformToCompany.sum("totalAmount"),
    PlatformToCompany.sum("paidAmount"),
  ]);
  return {
    totalAmount: totalAmount || 0,
    paidAmount: paidAmount || 0,
    pendingAmount: totalAmount - paidAmount,
  };
};

exports.getCompanyPaymentStats = async (companyId) => {
  const ptoc = await PlatformToCompany.findOne({
    where: {
      companyId,
    },
  });
  const [totalAmount, paidAmount] = await Promise.all([
    CompanyToStore.sum("totalAmount"),
    CompanyToStore.sum("paidAmount"),
  ]);

  return {
    ptoc: {
      totalAmount: ptoc?.totalAmount || 0,
      paidAmount: ptoc?.paidAmount || 0,
      pendingAmount: ptoc?.totalAmount - ptoc?.paidAmount || 0,
    },
    ctos: {
      totalAmount: totalAmount || 0,
      paidAmount: paidAmount || 0,
      pendingAmount: totalAmount - paidAmount,
    },
  };
};

exports.getStorePaymentStats = async (storeId) => {
  const data = await CompanyToStore.findOne({
    where: { storeId },
  });

  return {
    totalAmount: data?.totalAmount || 0,
    paidAmount: data?.paidAmount || 0,
    pendingAmount: data?.totalAmount - data?.paidAmount || 0,
  };
};

exports.payToCompany = async (companyId, amount) => {
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }
  if (!companyId) {
    throw new Error("Invalid company id");
  }
  const transaction = await sequelize.transaction();
  try {
    const newTransaction = await PlatformToCompanyTransaction.create(
      {
        companyId,
        amount,
        transaction: "straight",
        transactionId: transaction.id,
      },
      { transaction }
    );

    await PlatformToCompany.increment(
      {
        paidAmount: amount,
      },
      {
        where: { companyId },
        transaction,
      }
    );

    await transaction.commit();

    return newTransaction;
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};
