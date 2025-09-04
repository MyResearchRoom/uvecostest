const {
  Cart,
  Product,
  ProductImage,
  Wishlist,
  Pricerule,
  sequelize,
} = require("../models");

const distributorService = require("../services/distributorService");
const storeService = require("../services/storeService");

// const getFinalPrice = (originalPrice, discount) => {
//   const discountedPrice = originalPrice * (discount / 100);
//   return parseInt(discountedPrice);
// };

const getDiscountAmount = (originalPrice, discount) =>
  originalPrice * (discount / 100);

const getFinalPrice = (originalPrice, gst, discount) => {
  const gstv = originalPrice * (gst / 100);
  const discountedPrice = originalPrice - originalPrice * (discount / 100);
  return parseInt(discountedPrice + gstv);
};

const calculatePriceWithGST = (price, gst) =>
  parseInt(price) + parseInt((price / 100) * gst);

const calculateDiscountedPrice = (price, gst, discount) =>
  !discount
    ? calculatePriceWithGST(price, gst)
    : getFinalPrice(price, gst, discount);

// Add or update cart
exports.addToCart = async (userId, productId, quantity) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error("Product not found");
  const transaction = await sequelize.transaction();
  const cartItem = await Cart.findOne({
    where: { userId, productId },
    transaction,
  });
  if (cartItem) {
    throw new Error(" Product already in cart");
  } else {
    // await Wishlist.destroy({
    //   where: {
    //     userId: userId,
    //     productId: productId,
    //   },
    //   transaction,
    // });
    const cart = await Cart.create({
      userId,
      productId,
      quantity: quantity,
    });

    await transaction.commit();
    return cart;
  }
};

exports.incrementQuantity = async (userId, productId) => {
  const cartItem = await Cart.findOne({ where: { userId, productId } });
  if (!cartItem) throw new Error("Cart item not found");

  cartItem.quantity += 1;
  await cartItem.save();
  return cartItem;
};

exports.decrementQuantity = async (userId, productId) => {
  const cartItem = await Cart.findOne({ where: { userId, productId } });
  if (!cartItem) throw new Error("Cart item not found");

  if (cartItem.quantity > 1) {
    cartItem.quantity -= 1;
    await cartItem.save();
    return cartItem;
  } else {
    await cartItem.destroy();
    return null;
  }
};

exports.removeFromCart = async (userId, productId) => {
  const cartItem = await Cart.findOne({ where: { userId, productId } });
  if (!cartItem) throw new Error("Cart item not found");

  await cartItem.destroy();
  return { message: "Item removed from cart" };
};

exports.getCartItems = async (userId, role) => {
  try {
    const priceRule =
      role === "distributor"
        ? await distributorService.getDistributorPriceRule(userId)
        : role === "store"
        ? await storeService.getStorePriceRule(userId)
        : null;

    const cartItems = await Cart.findAll({
      where: { userId },
      attributes: ["id", "quantity"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "id",
            "productName",
            "originalPrice",
            "gst",
            "warranty",
            "returnOption",
            "handlingCharges",
            "shippingCharges",
            "otherCharges",
            "discount",
            "mrp",
          ],
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["id", "image", "contentType", "createdAt"],
              limit: 1,
            },
            {
              model: Pricerule,
              as: "pricerules",
              where: {
                name: priceRule?.dataValues?.priceRule || "",
              },
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      subTotal:
        calculateDiscountedPrice(
          item.product.originalPrice,
          item.product.gst,
          item.product.pricerules?.[0]?.priceValue
        ) * item.quantity,
      product: {
        id: item.product.id,
        productName: item.product.productName,
        quantity: item.quantity,
        originalPrice: calculatePriceWithGST(
          item.product.originalPrice,
          item.product.gst
        ),
        discountedPrice: calculateDiscountedPrice(
          item.product.originalPrice,
          item.product.gst,
          item.product.pricerules?.[0]?.priceValue
        ),
        specialDiscount: item.product.pricerules?.[0]?.priceValue || 0,
        specialDiscountAmount: getDiscountAmount(
          item.product.originalPrice,
          item.product.pricerules?.[0]?.priceValue || 0
        ),
        gst: item.product.gst,
        gstAmount: (item.product.originalPrice * item.product.gst) / 100,
        mrp: item.product.mrp || 0,
        majorDiscount: item.product.discount || 0,
        majorDiscountAmount: getDiscountAmount(
          item.product.mrp,
          item.product.discount
        ) || 0,
        handlingCharges: item.product.handlingCharges || 0,
        shippingCharges: item.product.shippingCharges || 0,
        otherCharges: item.product.otherCharges || 0,
        warranty: item.product.warranty,
        returnOption: item.product.returnOption,
        image: `data:${
          item.product.images[0].contentType
        };base64,${item.product.images[0].image.toString("base64")}`,
      },
    }));

    return data;
  } catch (error) {
    throw error;
  }
};

exports.getCartItem = async (userId, productId) => {
  try {
    const cartItem = await Cart.findOne({
      where: {
        userId,
        productId,
      },
    });

    return cartItem;
  } catch (error) {
    throw error;
  }
};
