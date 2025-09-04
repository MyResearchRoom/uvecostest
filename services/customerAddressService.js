const { CustomerAddress, sequelize } = require("../models");

// Create a new address
exports.createAddress = async (addressData) => {
  const transaction = await sequelize.transaction();
  try {
    if (addressData.selected) {
      await CustomerAddress.update(
        { selected: false },
        {
          where: {
            selected: true,
            userId: addressData.userId,
          },
          transaction, // Pass the transaction here
        }
      );
    }
    const customerAddress = await CustomerAddress.create(
      {
        ...addressData,
        selected: addressData.selected ? 1 : 0,
      },
      { transaction }
    );

    await transaction.commit();
    return customerAddress;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Get all addresses for a user
exports.getAddressesByUserId = async (userId) => {
  return await CustomerAddress.findAll({
    where: { userId },
    order: [["selected", "DESC"]],
  });
};

// Get a single address by its ID
exports.getAddressById = async (id) => {
  return await CustomerAddress.findByPk(id, {
    attributes: [
      "name",
      "mobileNumber",
      "pinCode",
      "state",
      "city",
      "district",
      "street",
      "baseAddress",
      "country",
    ],
  });
};

// Update an address
exports.updateAddress = async (id, userId, updateData) => {
  const address = await CustomerAddress.findOne({ where: { id, userId } });
  if (!address) {
    return null;
  }
  await address.update(updateData);
  return address;
};

// Soft delete an address
exports.deleteAddress = async (id, userId) => {
  try {
    const address = await CustomerAddress.findOne({ where: { id, userId } });
    if (!address) {
      throw new Error("Address not found");
    }
    if (address.selected) {
      throw new Error(
        "Cannot delete default address, please set another address as default."
      );
    }
    await address.destroy();
    return address;
  } catch (error) {
    throw error;
  }
};

exports.selectAddress = async (id, userId) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await CustomerAddress.findOne({
      where: { id, userId },
      transaction,
    });
    if (!address) {
      if (transaction) await transaction.rollback();
      throw new Error("Address not found");
    }
    const previouslySelctedAddress = await CustomerAddress.update(
      {
        selected: false,
      },
      {
        where: {
          selected: true,
          userId,
        },
        transaction,
      }
    );

    address.selected = true;
    await address.save({ transaction });

    await transaction.commit();

    return {
      ...address.toJSON(),
      previouslySelctedAddressId: previouslySelctedAddress.id,
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};
