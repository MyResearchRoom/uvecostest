const { Op, literal } = require("sequelize");
const { User } = require("../models");

exports.getCustomers = async ({ searchTerm, page, limit, filter }) => {
  let limit_ = parseInt(limit) !== "NaN" ? parseInt(limit) : 10;
  let page_ = parseInt(page) !== "NaN" ? parseInt(page) : 0;
  const offset = (page_ - 1) * limit_;

  let whereCluase = { role: "customer" };

  if (searchTerm && searchTerm.trim() !== "") {
    whereCluase = {
      ...whereCluase,
      [Op.or]: [
        {
          name: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
        {
          "$customerAddress.city$": {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      ],
    };
  }

  if (filter.city) {
    whereCluase = {
      ...whereCluase,
      [Op.and]: [
        literal(`(
        SELECT ca.city
        FROM customer_addresses ca
        WHERE ca.userId = User.id
        ORDER BY ca.selected DESC
        LIMIT 1
      ) = '${filter.city}'
      `),
      ],
    };
  }

  try {
    const { rows: customers, count: totalCustomers } =
      await User.findAndCountAll({
        attributes: [
          "id",
          "name",
          "email",
          "mobileNumber",
          [
            literal(`(
            SELECT COUNT(DISTINCT o.id)
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.orderId
            INNER JOIN order_products op ON op.orderItemId = oi.id
            WHERE o.customerId = User.id
              AND op.status IN ('processing', 'return+processing')
          )`),
            "totalOrderCount",
          ],
          [
            literal(`(
            SELECT COUNT(DISTINCT ro.id)
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.orderId
            INNER JOIN order_products op ON op.orderItemId = oi.id
            INNER JOIN return_orders ro ON ro.orderItemId = oi.id
            WHERE o.customerId = User.id
              AND op.status IN ('return', 'return+processing')
          )`),
            "returnOrderCount",
          ],
          [
            literal(`(
            SELECT COUNT(DISTINCT co.id)
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.orderId
            INNER JOIN cancel_orders co ON co.orderItemId = oi.id
            WHERE o.customerId = User.id
          )`),
            "cancelOrderCount",
          ],
          [
            literal(`(
              SELECT ca.city
              FROM customer_addresses ca
              WHERE ca.userId = User.id
              ORDER BY ca.selected DESC
              LIMIT 1
            )`),
            "city",
          ],
        ],
        where: whereCluase,
        limit: limit_,
        offset: offset,
      });

    return {
      data: customers,
      pagination: {
        page: page_,
        limit: limit_,
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit_),
      },
    };
  } catch (error) {
    throw error;
  }
};
