const { Op } = require("sequelize");
const {
  OrderItem,
  Order,
  Product,
  OrderProduct,
  DeliveryAddress,
  User,
  Store,
  Company,
  BigOrderItem,
  BigOrder,
  OfflineOrder,
  OfflineOrderItem,
  OfflineCustomer,
  ReturnOrder,
} = require("../models");
const { decryptSensitiveData } = require("../utils/cryptography");
const { getCompanyOwnStore } = require("./AuthService");

exports.getInvoice = async (orderId, userId, role) => {
  const includes = [
    {
      model: OrderProduct,
      as: "products",
      attributes: [
        "quantity",
        "mrp",
        "price",
        "gst",
        "discount",
        "shippingCharges",
        "handlingCharges",
        "otherCharges",
      ],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
        },
      ],
    },
    {
      model: DeliveryAddress,
      as: "deliveryAddress",
    },
    {
      model: Order,
      as: "order",
      attributes: ["id"],
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["name"],
        },
      ],
    },
  ];

  const whereClause = { id: orderId };

  if (role === "store") {
    whereClause.storeId = userId;
    includes.push({
      model: User,
      as: "user",
      attributes: ["id", "name"],
      include: [
        {
          model: Store,
          as: "store",
          attributes: [
            "pinCode",
            "street",
            "baseAddress",
            "city",
            "district",
            "state",
            "country",
          ],
        },
      ],
    });
  } else {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
    includes.push({
      model: Company,
      as: "company",
      attributes: [
        "companyName",
        "primaryPinCode",
        "primaryState",
        "primaryDistrict",
        "companyAddress",
        "city",
        "gstNumber",
      ],
    });
  }

  try {
    const order = await OrderItem.findOne({
      attributes: ["shipDate"],
      where: whereClause,
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let handlingCharges = 0,
      shippingCharges = 0,
      otherCharges = 0,
      total = 0;

    const products = order.products.map((item) => {
      handlingCharges += item.handlingCharges || 0;
      shippingCharges += item.shippingCharges || 0;
      otherCharges += item.otherCharges || 0;
      total += item.price * item.quantity;
      const originalPrice = parseFloat(
        item.price / (1 + item.gst / 100)
      ).toFixed(2);

      return {
        id: item.id,
        productName: item.product.productName,
        mrp: item.mrp ?? 0,
        quantity: item.quantity,
        price: originalPrice,
        gst: item.gst,
        gstAmount: parseFloat((originalPrice * item.gst) / 100).toFixed(2),
        discount: item.discount || 0,
        // discount: parseFloat(
        //   item.product.mrp - (item.price - (item.gst * item.price) / 100)
        // ).toFixed(2),
        subTotal: item.price * item.quantity,
      };
    });

    return {
      companyAddress:
        role === "store"
          ? {
              companyName: order.user.name,
              pinCode: order.user.store.pinCode,
              street: order.user.store.street,
              baseAddress: order.user.store.baseAddress,
              city: order.user.store.city,
              district: order.user.store.district,
              state: order.user.store.state,
              country: order.user.store.country,
            }
          : {
              companyName: order.company.companyName,
              pinCode: order.company.primaryPinCode,
              baseAddress: order.company.companyAddress,
              city: order.company.city,
              district: order.company.primaryDistrict,
              state: order.company.primaryState,
              country: "India",
            },
      deliveryAddress: order.deliveryAddress,
      invoiceNumber: order.order.id,
      invoiceDate: order.shipDate?.toLocaleDateString(),
      gstNumber: order.company?.gstNumber
        ? decryptSensitiveData(order.company?.gstNumber)
        : null,
      products,
      handlingCharges: parseFloat(handlingCharges).toFixed(2),
      shippingCharges: parseFloat(shippingCharges).toFixed(2),
      otherCharges: parseFloat(otherCharges).toFixed(2),
      total: parseFloat(total).toFixed(2),
      final: parseFloat(
        parseFloat(total) +
          parseFloat(handlingCharges) +
          parseFloat(shippingCharges) +
          parseFloat(otherCharges)
      ).toFixed(2),
    };
  } catch (error) {
    throw error;
  }
};

exports.getSingleInvoice = async (orderId, userId) => {
  try {
    const order = await OrderProduct.findOne({
      where: {
        id: orderId,
      },
      attributes: [
        "quantity",
        "price",
        "gst",
        "discount",
        "orderItemId",
        "handlingCharges",
        "shippingCharges",
        "otherCharges",
      ],
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id", "shipDate"],
          include: [
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
            },
            {
              model: Order,
              as: "order",
              attributes: ["id"],
              where: {
                customerId: userId,
              },
              required: true,
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
              include: [
                {
                  model: Store,
                  as: "store",
                  attributes: [
                    "pinCode",
                    "street",
                    "baseAddress",
                    "city",
                    "district",
                    "state",
                    "country",
                  ],
                },
              ],
            },
            {
              model: Company,
              as: "company",
              attributes: [
                "companyName",
                "primaryPinCode",
                "primaryState",
                "primaryDistrict",
                "companyAddress",
                "city",
                "gstNumber",
              ],
            },
          ],
          required: true,
        },
        {
          model: Product,
          as: "product",
          attributes: [
            "id",
            "productName",
            "weight",
            "height",
            "width",
            "length",
          ],
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const originalPrice = parseFloat(
      order.price / (1 + order.gst / 100)
    ).toFixed(2);

    return {
      companyAddress: order.orderItem.user
        ? {
            companyName: order.orderItem.user.name,
            pinCode: order.orderItem.user.store.pinCode,
            street: order.orderItem.user.store.street,
            baseAddress: order.orderItem.user.store.baseAddress,
            city: order.orderItem.user.store.city,
            district: order.orderItem.user.store.district,
            state: order.orderItem.user.store.state,
            country: order.orderItem.user.store.country,
          }
        : {
            companyName: order.orderItem.company.companyName,
            pinCode: order.orderItem.company.primaryPinCode,
            baseAddress: order.orderItem.company.companyAddress,
            city: order.orderItem.company.city,
            district: order.orderItem.company.primaryDistrict,
            state: order.orderItem.company.primaryState,
            country: "India",
          },
      deliveryAddress: order.orderItem.deliveryAddress,
      invoiceNumber: order.orderItem.id,
      invoiceDate: order.orderItem.shipDate?.toLocaleDateString(),
      gstNumber: order.orderItem?.company?.gstNumber
        ? decryptSensitiveData(order.orderItem.company.gstNumber)
        : null,
      products: [
        {
          id: order.product.id,
          productName: order.product.productName,
          mrp: order.mrp ?? 0,
          quantity: order.quantity,
          price: originalPrice,
          gst: order.gst,
          gstAmount: (order.gst * originalPrice) / 100,
          discount: order.discount || 0,
          // discount: parseFloat(
          //   order.product.mrp - (order.price - (order.gst * order.price) / 100)
          // ).toFixed(2),
          subTotal: order.price * order.quantity,
        },
      ],
      handlingCharges: parseFloat(order.handlingCharges || 0).toFixed(2),
      shippingCharges: parseFloat(order.shippingCharges || 0).toFixed(2),
      otherCharges: parseFloat(order.otherCharges || 0).toFixed(2),
      total: order.price * order.quantity,
      final: parseFloat(
        parseFloat(order.price * order.quantity) +
          parseFloat(order.handlingCharges || 0) +
          parseFloat(order.shippingCharges || 0) +
          parseFloat(order.otherCharges || 0)
      ).toFixed(2),
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigSingleInvoice = async (orderId, userId) => {
  try {
    const order = await BigOrderItem.findOne({
      attributes: [
        "bigOrderId",
        "price",
        "gst",
        "discount",
        "handlingCharges",
        "shippingCharges",
        "otherCharges",
        "quantity",
        "subTotal",
        "shipDate",
      ],
      where: {
        id: orderId,
      },
      include: [
        {
          model: BigOrder,
          as: "order",
          where: {
            customerId: userId,
          },
          include: [
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
          include: [
            {
              model: Store,
              as: "store",
              attributes: [
                "pinCode",
                "street",
                "baseAddress",
                "city",
                "district",
                "state",
                "country",
              ],
            },
          ],
        },
        {
          model: Company,
          as: "company",
          attributes: [
            "companyName",
            "primaryPinCode",
            "primaryState",
            "primaryDistrict",
            "companyAddress",
            "city",
            "gstNumber",
          ],
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const originalPrice = parseFloat(
      order.price / (1 + order.gst / 100)
    ).toFixed(2);

    return {
      companyAddress: order.user
        ? {
            companyName: order.user.name,
            pinCode: order.user.store.pinCode,
            street: order.user.store.street,
            baseAddress: order.user.store.baseAddress,
            city: order.user.store.city,
            district: order.user.store.district,
            state: order.user.store.state,
            country: order.user.store.country,
          }
        : {
            companyName: order.company.companyName,
            pinCode: order.company.primaryPinCode,
            baseAddress: order.company.companyAddress,
            city: order.company.city,
            district: order.company.primaryDistrict,
            state: order.company.primaryState,
            country: "India",
          },
      deliveryAddress: order.order.deliveryAddress,
      invoiceNumber: order.bigOrderId,
      invoiceDate: order.shipDate?.toLocaleDateString(),
      gstNumber: order?.company?.gstNumber
        ? decryptSensitiveData(order.company.gstNumber)
        : null,
      products: [
        {
          id: order.product.id,
          productName: order.product.productName,
          mrp: order.mrp ?? 0,
          quantity: order.quantity,
          price: originalPrice,
          gst: order.gst,
          gstAmount: (originalPrice * order.gst) / 100,
          discount: order.discount || 0,
          subTotal: order.price * order.quantity,
        },
      ],
      handlingCharges: parseFloat(order.handlingCharges || 0).toFixed(2),
      shippingCharges: parseFloat(order.shippingCharges || 0).toFixed(2),
      otherCharges: parseFloat(order.otherCharges || 0).toFixed(2),
      total: order.price * order.quantity,
      final: parseFloat(
        parseFloat(order.price * order.quantity) +
          parseFloat(order.handlingCharges || 0) +
          parseFloat(order.shippingCharges || 0) +
          parseFloat(order.otherCharges || 0)
      ).toFixed(2),
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigInvoice = async (orderId, userId, role) => {
  const whereClause = { id: orderId };
  const includes = [
    {
      model: BigOrder,
      as: "order",
      include: [
        {
          model: DeliveryAddress,
          as: "deliveryAddress",
        },
      ],
    },
    {
      model: Product,
      as: "product",
      attributes: ["productName"],
    },
  ];
  if (role === "store") {
    whereClause.storeId = userId;
    includes.push({
      model: User,
      as: "user",
      attributes: ["id", "name"],
      include: [
        {
          model: Store,
          as: "store",
          attributes: [
            "pinCode",
            "street",
            "baseAddress",
            "city",
            "district",
            "state",
            "country",
          ],
        },
      ],
    });
  } else {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
    includes.push({
      model: Company,
      as: "company",
      attributes: [
        "companyName",
        "primaryPinCode",
        "primaryState",
        "primaryDistrict",
        "companyAddress",
        "city",
        "gstNumber",
      ],
    });
  }

  try {
    const order = await BigOrderItem.findOne({
      attributes: [
        "bigOrderId",
        "price",
        "gst",
        "discount",
        "handlingCharges",
        "shippingCharges",
        "otherCharges",
        "quantity",
        "subTotal",
        "shipDate",
      ],
      where: whereClause,
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const originalPrice = parseFloat(
      order.price / (1 + order.gst / 100)
    ).toFixed(2);

    return {
      companyAddress:
        role === "store"
          ? {
              companyName: order.user.name,
              pinCode: order.user.store.pinCode,
              street: order.user.store.street,
              baseAddress: order.user.store.baseAddress,
              city: order.user.store.city,
              district: order.user.store.district,
              state: order.user.store.state,
              country: order.user.store.country,
            }
          : {
              companyName: order.company.companyName,
              pinCode: order.company.primaryPinCode,
              baseAddress: order.company.companyAddress,
              city: order.company.city,
              district: order.company.primaryDistrict,
              state: order.company.primaryState,
              country: "India",
            },
      deliveryAddress: order.order.deliveryAddress,
      invoiceNumber: order.bigOrderId,
      invoiceDate: order.shipDate?.toLocaleDateString(),
      gstNumber: order?.company?.gstNumber
        ? decryptSensitiveData(order.company.gstNumber)
        : null,
      products: [
        {
          id: order.product.id,
          productName: order.product.productName,
          mrp: order.mrp ?? 0,
          quantity: order.quantity,
          price: originalPrice,
          gst: order.gst,
          gstAmount: (originalPrice * order.gst) / 100,
          discount: order.discount || 0,
          // discount: parseFloat(
          //   order.product.mrp - (order.price - (order.gst * order.price) / 100)
          // ).toFixed(2),
          subTotal: order.price * order.quantity,
        },
      ],
      handlingCharges: parseFloat(order.handlingCharges || 0).toFixed(2),
      shippingCharges: parseFloat(order.shippingCharges || 0).toFixed(2),
      otherCharges: parseFloat(order.otherCharges || 0).toFixed(2),
      total: order.price * order.quantity,
      final: parseFloat(
        parseFloat(order.price * order.quantity) +
          parseFloat(order.handlingCharges || 0) +
          parseFloat(order.shippingCharges || 0) +
          parseFloat(order.otherCharges || 0)
      ).toFixed(2),
    };
  } catch (error) {
    throw error;
  }
};

exports.getOfflineInvoice = async (orderId, storeId, companyId, role) => {
  const includes = [
    {
      model: OfflineOrderItem,
      as: "items",
      attributes: ["quantity", "price", "gst", "subTotal"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName"],
        },
      ],
    },
    {
      model: OfflineCustomer,
      as: "customer",
      attributes: [
        "name",
        "email",
        "mobileNumber",
        "address",
        "state",
        "city",
        "district",
        "pinCode",
      ],
    },
  ];

  if (role === "store") {
    includes.push({
      model: User,
      as: "user",
      attributes: ["id", "name"],
      include: [
        {
          model: Store,
          as: "store",
          attributes: [
            "pinCode",
            "street",
            "baseAddress",
            "city",
            "district",
            "state",
            "country",
          ],
        },
      ],
    });
  } else {
    includes.push({
      model: Company,
      as: "company",
      attributes: [
        "companyName",
        "primaryPinCode",
        "primaryState",
        "primaryDistrict",
        "companyAddress",
        "city",
        "gstNumber",
      ],
    });
  }

  try {
    const order = await OfflineOrder.findOne({
      attributes: ["total", "id", "createdAt"],
      where: { id: orderId, storeId, companyId },
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let total = 0;

    const products = order.items.map((item) => {
      total += item.price * item.quantity;
      const originalPrice = parseFloat(
        item.price / (1 + item.gst / 100)
      ).toFixed(2);

      return {
        id: item.id,
        productName: item.product.productName,
        mrp: item.mrp ?? 0,
        quantity: item.quantity,
        price: originalPrice,
        gst: item.gst,
        gstAmount: parseFloat((originalPrice * item.gst) / 100).toFixed(2),
        discount:
          parseFloat(
            item.mrp - (item.price - (item.gst * originalPrice) / 100)
          ).toFixed(2) || 0,
        subTotal: item.price * item.quantity,
      };
    });

    return {
      companyAddress:
        role === "store"
          ? {
              companyName: order.user.name,
              pinCode: order.user.store.pinCode,
              street: order.user.store.street,
              baseAddress: order.user.store.baseAddress,
              city: order.user.store.city,
              district: order.user.store.district,
              state: order.user.store.state,
              country: order.user.store.country,
            }
          : {
              companyName: order.company.companyName,
              pinCode: order.company.primaryPinCode,
              baseAddress: order.company.companyAddress,
              city: order.company.city,
              district: order.company.primaryDistrict,
              state: order.company.primaryState,
              country: "India",
            },
      deliveryAddress: {
        name: order.customer.name,
        email: order.customer.email,
        mobileNumber: order.customer.mobileNumber,
        address: order.customer.address,
        city: order.customer.city,
        district: order.customer.district,
        state: order.customer.state,
        pinCode: order.customer.pinCode,
      },
      invoiceNumber: order.id,
      invoiceDate: order.createdAt.toLocaleDateString(),
      gstNumber: order.company?.gstNumber
        ? decryptSensitiveData(order.company.gstNumber)
        : null,
      products,
      total,
      final: total,
    };
  } catch (error) {
    throw error;
  }
};

exports.getReturnSingleInvoice = async (orderId, userId) => {
  try {
    const order = await OrderProduct.findOne({
      where: {
        id: orderId,
      },
      attributes: [
        "quantity",
        "price",
        "gst",
        "discount",
        "orderItemId",
        "handlingCharges",
        "shippingCharges",
        "otherCharges",
      ],
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id", "shipDate"],
          include: [
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
            },
            {
              model: Order,
              as: "order",
              attributes: ["id"],
              where: {
                customerId: userId,
              },
              required: true,
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
              include: [
                {
                  model: Store,
                  as: "store",
                  attributes: [
                    "pinCode",
                    "street",
                    "baseAddress",
                    "city",
                    "district",
                    "state",
                    "country",
                  ],
                },
              ],
            },
            {
              model: Company,
              as: "company",
              attributes: [
                "companyName",
                "primaryPinCode",
                "primaryState",
                "primaryDistrict",
                "companyAddress",
                "city",
                "gstNumber",
              ],
            },
          ],
          required: true,
        },
        {
          model: Product,
          as: "product",
          attributes: [
            "id",
            "productName",
            "weight",
            "height",
            "width",
            "length",
          ],
        },
        {
          model: ReturnOrder,
          as: "returnOrder",
          attributes: ["id", "returnQuantity"],
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const originalPrice = parseFloat(
      order.price / (1 + order.gst / 100)
    ).toFixed(2);

    return {
      companyAddress: order.orderItem.user
        ? {
            companyName: order.orderItem.user.name,
            pinCode: order.orderItem.user.store.pinCode,
            street: order.orderItem.user.store.street,
            baseAddress: order.orderItem.user.store.baseAddress,
            city: order.orderItem.user.store.city,
            district: order.orderItem.user.store.district,
            state: order.orderItem.user.store.state,
            country: order.orderItem.user.store.country,
          }
        : {
            companyName: order.orderItem.company.companyName,
            pinCode: order.orderItem.company.primaryPinCode,
            baseAddress: order.orderItem.company.companyAddress,
            city: order.orderItem.company.city,
            district: order.orderItem.company.primaryDistrict,
            state: order.orderItem.company.primaryState,
            country: "India",
          },
      deliveryAddress: order.orderItem.deliveryAddress,
      invoiceNumber: order.orderItem.id,
      invoiceDate: order.orderItem.shipDate?.toLocaleDateString(),
      gstNumber: order.orderItem?.company?.gstNumber
        ? decryptSensitiveData(order.orderItem.company.gstNumber)
        : null,
      products: [
        {
          id: order.product.id,
          productName: order.product.productName,
          mrp: order.mrp ?? 0,
          quantity: order.returnOrder.returnQuantity,
          price: originalPrice,
          gst: order.gst,
          gstAmount: (parseFloat(originalPrice) * order.gst) / 100,
          discount: order.discount || 0,
          // discount: parseFloat(
          //   order.product.mrp - (order.price - (order.gst * order.price) / 100)
          // ).toFixed(2),
          subTotal: order.price * order.returnOrder.returnQuantity,
        },
      ],
      handlingCharges: parseFloat(order.handlingCharges || 0).toFixed(2),
      shippingCharges: parseFloat(order.shippingCharges || 0).toFixed(2),
      otherCharges: parseFloat(order.otherCharges || 0).toFixed(2),
      total: order.price * order.returnOrder.returnQuantity,
      final: parseFloat(
        parseFloat(order.price * order.returnOrder.returnQuantity) +
          parseFloat(order.handlingCharges || 0) +
          parseFloat(order.shippingCharges || 0) +
          parseFloat(order.otherCharges || 0)
      ).toFixed(2),
    };
  } catch (error) {
    throw error;
  }
};

exports.getAfterBillGenerateInvoice = async (
  orderId,
  storeId,
  companyId,
  role
) => {
  const includes = [
    {
      model: OfflineOrderItem,
      as: "items",
      attributes: ["quantity", "price", "gst", "subTotal"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName"],
        },
      ],
    },
    {
      model: OfflineCustomer,
      as: "customer",
      attributes: [
        "name",
        "email",
        "mobileNumber",
        "address",
        "pinCode",
        "state",
        "district",
        "city",
      ],
    },
  ];

  if (role === "store") {
    includes.push({
      model: User,
      as: "user",
      attributes: ["id", "name"],
      include: [
        {
          model: Store,
          as: "store",
          attributes: [
            "pinCode",
            "street",
            "baseAddress",
            "city",
            "district",
            "state",
            "country",
          ],
        },
      ],
    });
  } else {
    includes.push({
      model: Company,
      as: "company",
      attributes: [
        "companyName",
        "primaryPinCode",
        "primaryState",
        "primaryDistrict",
        "companyAddress",
        "city",
        "gstNumber",
      ],
    });
  }

  try {
    const order = await OfflineOrder.findOne({
      attributes: ["total", "id", "createdAt"],
      where: { id: orderId, storeId, companyId },
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let total = 0;

    const products = order.items.map((item) => {
      total += item.price * item.quantity;
      const originalPrice = parseFloat(
        item.price / (1 + item.gst / 100)
      ).toFixed(2);

      return {
        id: item.id,
        productName: item.product.productName,
        mrp: item.mrp ?? 0,
        quantity: item.quantity,
        price: originalPrice,
        gst: item.gst,
        gstAmount: parseFloat((originalPrice * item.gst) / 100).toFixed(2),
        discount: parseFloat(
          item.mrp - (item.price - (item.gst * originalPrice) / 100)
        ).toFixed(2) || 0,
        subTotal: item.price * item.quantity,
      };
    });

    return {
      companyAddress:
        role === "store"
          ? {
              companyName: order.user.name,
              pinCode: order.user.store.pinCode,
              street: order.user.store.street,
              baseAddress: order.user.store.baseAddress,
              city: order.user.store.city,
              district: order.user.store.district,
              state: order.user.store.state,
              country: order.user.store.country,
            }
          : {
              companyName: order.company.companyName,
              pinCode: order.company.primaryPinCode,
              baseAddress: order.company.companyAddress,
              city: order.company.city,
              district: order.company.primaryDistrict,
              state: order.company.primaryState,
              country: "India",
            },
      deliveryAddress: {
        name: order.customer.name,
        email: order.customer.email,
        mobileNumber: order.customer.mobileNumber,
        address: order.customer.address,
        city: order.customer.city,
        district: order.customer.district,
        state: order.customer.state,
        pinCode: order.customer.pinCode,
      },
      invoiceNumber: order.id,
      invoiceDate: order.createdAt.toLocaleDateString(),
      gstNumber: order.company?.gstNumber
        ? decryptSensitiveData(order.company.gstNumber)
        : null,
      products,
      total,
      final: total,
    };
  } catch (error) {
    throw error;
  }
};
