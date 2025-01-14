import { formatObjectId } from "../src/utils_functional";
import { sleep } from "../src/utils_components";


async function getOrderInfoBrief(orderId, graphql) {
  sleep(500).then(() => {});
  return {
      adminOrderData: await supplementOrderBrief(orderId, graphql),
      lineItemsData: await supplementLineItemsBrief(orderId, graphql),
  }
}

async function getOrderIds(graphql) {
  const orderIds = [];
  {
  // get order ids for orders where status == OPEN
  let [hasNextPage, endCursor, n_objects] = [true, null, 10];
  while (hasNextPage===true) {
      sleep(1000).then(() => {});
      const queryRange = endCursor != null ? `first:${n_objects}, after:"${endCursor}"` : `first:${n_objects}`;
      const queryStatus = `query: "status:'OPEN'"`;
      const response = await graphql(
      `
          query getOrders {
              orders(${queryRange} reverse:true ${queryStatus}) {
                  pageInfo {
                      hasNextPage
                      endCursor
                  }
                  edges {
                      node {
                          id
                      }
                  }
              }
          }
          `,
      );
      const {
          data: { orders },
      } = await response.json();
      const ids = orders.edges.map((edge) => edge.node.id);
      hasNextPage = orders.pageInfo.hasNextPage;
      endCursor = orders.pageInfo.endCursor;

      orderIds.push(...ids);
  }}
  {
  // get order ids for orders where status == CLOSED
  let [hasNextPage, endCursor, n_objects] = [true, null, 10];
  while (hasNextPage===true && orderIds.length < 150) {
  // while (hasNextPage===true) {
    await sleep(1000).then(() => {});
    const queryRange = endCursor != null ? `first:${n_objects}, after:"${endCursor}"` : `first:${n_objects}`;
    const queryStatus = `query: "status:'CLOSED'"`;
    const response = await graphql(
    `
        query getOrders {
          orders(${queryRange} reverse:true ${queryStatus}) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        id
                    }
                }
            }
        }
        `,
    );
    const {
        data: { orders },
    } = await response.json();
    const ids = orders.edges.map((edge) => edge.node.id);
    hasNextPage = orders.pageInfo.hasNextPage;
    endCursor = orders.pageInfo.endCursor;

    orderIds.push(...ids);
  }}
  if (orderIds.length === 0) return [];
  return {
    "orderIds": orderIds,
  };
}

export async function getOrdersBrief(graphql) {
  const { orderIds } = await getOrderIds(graphql);
  return Promise.all(
      orderIds.map((id) => getOrderInfoBrief(id, graphql))
  );
}

export async function getOrdersBriefMobile(graphql) {
  const { orderIds } = await getOrderIds(graphql);
  return Promise.all(
      orderIds.map((id) => supplementOrderBrief(id, graphql))
  );
}


async function supplementOrderBrief(orderId, graphql) {
    const response = await graphql(
      `
      query supplementOrderBrief($id: ID!) {
        order(id: $id) {
          id
          name
          confirmationNumber
          createdAt
          displayFulfillmentStatus
          note
          closed
          customer {
            displayName
          }
          cancelledAt
          shippingAddress {
            name
            address1
            address2
            city
            province
            zip
            countryCodeV2
            phone
          }
          email
          phone
          quantity: metafield(namespace: "order_specs", key:"number_of_items") {
            value
          }
          packagingDate: metafield(namespace: "order_specs", key:"packaging_date") {
            value
          }
          deliveryDate: metafield(namespace: "order_specs", key:"delivery_date") {
            value
          }
          tags
        }
      }
      `,
      {
        variables: {
          id: orderId,
        },
      }
    );
  
    const {
      data: { order },
    } = await response.json();
    return {
      id: formatObjectId(order.id),
      orderId: order.id,
      orderNumber: order?.name,
      email: order?.email,
      phone: order?.phone,
      confirmationNumber: order?.confirmationNumber,
      createdAt: order?.createdAt,
      quantity: order.quantity == null ? null : Number(order.quantity.value),
      deliveryDate: formatDate(order.deliveryDate),
      packagingDate: formatDate(order.packagingDate),
      fulfillmentStatus: order?.displayFulfillmentStatus,
      orderNote: order?.note,
      isClosed: order?.closed,
      isCancelled: order.cancelledAt ? true : false,
      customerName: order.customer==null ? "Invalid name" : order.customer.displayName,
      shippingAddress: order.shippingAddress,
    };
}

async function supplementLineItemsBrief(orderId, graphql) {
  let [hasNextPage, endCursor, n_lineitems] = [true, null, 25];
    const lineItems = [];
    while (hasNextPage===true) {
      const queryRange = endCursor != null ? `first:${n_lineitems}, after:"${endCursor}"` : `first:${n_lineitems}`;
      const response = await graphql(
        `
        query supplementLineItemsBrief($id: ID!) {
          order(id: $id) {
            id
            lineItems(${queryRange}) {
                nodes {
                    id
                    name
                    quantity
                    sku
                    product {
                      id
                      metafield(namespace: "product_specs", key:"farm_name") {
                        value
                      }
                    }
                    colors: customAttributes {
                      key
                        value
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
          }
        }
        `,
        {
          variables: {
            id: orderId,
          },
        }
      );
      const {
        data: { order },
      } = await response.json();
  
      lineItems.push(...order.lineItems.nodes);
      hasNextPage = order.lineItems.pageInfo.hasNextPage;
      endCursor = order.lineItems.pageInfo.endCursor;
    }
    return {
      orderId: orderId,
      lineItems: lineItems,
      hasNextPage: hasNextPage,
      endCursor: endCursor,
    };
}

async function getOrderInfoVerbose(orderId, graphql) {
    return {
        adminOrderData: await supplementOrderVerbose(orderId, graphql),
        lineItemsData: await supplementLineItemsVerbose(orderId, graphql),
    }
}

export async function getOrderVerbose(orderId, graphql) {
    return getOrderInfoVerbose(orderId, graphql);
}

export async function getOrdersVerbose(graphql) {
    //
}

async function supplementOrderVerbose(orderId, graphql) {
    const response = await graphql(
      `
      query supplementOrderVerbose($id: ID!) {
        order(id: $id) {
          id
          name
          confirmationNumber
          createdAt
          displayFulfillmentStatus
          note
          closed
          cancelledAt
          customer {
            displayName
          }
          shippingAddress {
            name
            address1
            address2
            city
            province
            zip
            countryCodeV2
            phone
          }
          quantity: metafield(namespace: "order_specs", key:"number_of_items") {
            value
          }
          packagingDate: metafield(namespace: "order_specs", key:"packaging_date") {
            value
          }
          deliveryDate: metafield(namespace: "order_specs", key:"delivery_date") {
            value
          }
          tags
          totalPriceSet{
            presentmentMoney {
                amount
              }
          }
          subtotalPriceSet{
            presentmentMoney {
                amount
              }
          }
          totalDiscountsSet {
            presentmentMoney {
              amount
            }
          }
          totalShippingPriceSet {
            presentmentMoney {
              amount
            }
          }
          totalTaxSet {
            presentmentMoney {
              amount
            }
          }
          currencyCode
          discountCodes
        }
      }
      `,
      {
        variables: {
          id: orderId,
        },
      }
    );
  
    const {
      data: { order },
    } = await response.json();

    return {
        id: formatObjectId(order.id),
        orderId: order.id,
        orderNumber: order?.name,
        confirmationNumber: order?.confirmationNumber,
        createdAt: order?.createdAt,
        quantity: order.quantity == null ? null : Number(order.quantity.value),
        deliveryDate: formatDate(order.deliveryDate),
        packagingDate: formatDate(order.packagingDate),
        fulfillmentStatus: order?.displayFulfillmentStatus,
        orderNote: order?.note,
        isClosed: order?.closed,
        isCancelled: order.cancelledAt ? true : false,
        customerName: order.customer==null ? "Invalid name" : order.customer.displayName,
        shippingAddress: order.shippingAddress,
        tags: order?.tags,
        discountCodes: order?.discountCodes,
        currencyCode: order?.currencyCode,
        orderTotal: order?.totalPriceSet.presentmentMoney.amount,
        orderSubtotal: order?.subtotalPriceSet.presentmentMoney.amount,
        orderDiscountAmount: order?.totalDiscountsSet.presentmentMoney.amount,
        shippingCost: order?.totalShippingPriceSet.presentmentMoney.amount,
        taxCost: order?.totalTaxSet.presentmentMoney.amount,
    };
}

async function supplementLineItemsVerbose(orderId, graphql) {
    let [hasNextPage, endCursor, n_lineitems] = [true, null, 25];
    const lineItems = [];
  
    while (hasNextPage===true) {
      const queryRange = endCursor != null ? `first:${n_lineitems}, after:"${endCursor}"` : `first:${n_lineitems}`;
  
      const response = await graphql(
        `
        query supplementLineItemsVerbose($id: ID!) {
          order(id: $id) {
            id
            lineItems(${queryRange}) {
              nodes {
                id
                name
                quantity
                sku
                product {
                  id
                  metafield(namespace: "product_specs", key:"farm_name") {
                    value
                  }
                }
                colors: customAttributes {
                    key
                    value
                }
                originalUnitPriceSet {
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }
                discountedUnitPriceAfterAllDiscountsSet {
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }
                image {
                  altText
                  url
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
        `,
        {
          variables: {
            id: orderId,
          },
        }
      );
  
      const {
        data: { order },
      } = await response.json();
      lineItems.push(...order.lineItems.nodes);
      hasNextPage = order.lineItems.pageInfo.hasNextPage;
      endCursor = order.lineItems.pageInfo.endCursor;
    }
  
    return {
      orderId: orderId,
      lineItems: lineItems,
      hasNextPage: hasNextPage,
      endCursor: endCursor,
    };
}

function formatDate(date) {
    if (date == null) {
        return new Date(null);
    }
    return new Date(date.value);
}

export function validateOrder(data) {
    const errors = {};
  
    if (!data.orderNumber) {
      errors.orderNumber = "orderNumber is required";
    }
    if (!data.orderId) {
      errors.orderId = "orderId is required";
    }
  
    if (Object.keys(errors).length) {
      return errors;
    }
}