import fs from "fs";
import { sleep } from "../src/utils_components";


export function firstTimeInstallCheck(shop) {
  const shopInstalled = fs.existsSync(`app/src/Installations/${shop}.txt`);
  if (shopInstalled) {
    console.log("Installation process already completed for:", shop);
    return false;
  }
  console.log("Installation process required for:", shop, "\n"); 
  return true;
}

export function recordFirstTimeInstallation(shop) {
  const data = `Shop: ${shop}\n${new Date()}\n`;
  fs.writeFile(`app/src/Installations/${shop}.txt`, data, (err) => {
    return {
      success: -1,
      message: `Installation process failed for: ${shop}`
    };
  })
  return {
    success: 1,
    message: `Installation process completed for: ${shop}`
  };
}

export async function defineNewMetafields(graphql) {
  const metafieldSpecs = [
    {
      "name": "Delivery Date",
      "namespace": "order_specs",
      "key": "delivery_date",
      "description": "Delivery date for the order.",
      "type": "date",
      "ownerType": "ORDER"
    },
    {
      "name": "Packaging Date",
      "namespace": "order_specs",
      "key": "packaging_date",
      "description": "Packaging date for the order.",
      "type": "date",
      "ownerType": "ORDER"
    },
    {
      "name": "Number of items",
      "namespace": "order_specs",
      "key": "number_of_items",
      "description": "The total number of items in the order.",
      "type": "number_integer",
      "ownerType": "ORDER"
    }
  ];
  return Promise.all(
    metafieldSpecs.map((metafieldDefinition) => metafieldDefinitionCreate(graphql, metafieldDefinition))
  );
}

async function metafieldDefinitionCreate(graphql, metafieldDefinition) {
  const response = await graphql(
    `#graphql
    mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: 
      {
        "definition": {
          "name": metafieldDefinition.name,
          "namespace": metafieldDefinition.namespace,
          "key": metafieldDefinition.key,
          "description": metafieldDefinition.description,
          "type": metafieldDefinition.type,
          "ownerType": metafieldDefinition.ownerType
        }
      }
    }
  );
  const {
    data: { metafieldDefinitionCreate },
  } = await response.json();
  return {
    "metafields": metafieldDefinitionCreate.metafields,
    "userErrors": metafieldDefinitionCreate.userErrors,
  };
}

export async function getRetroactiveOrderIds(graphql) {
    let [hasNextPage, endCursor, n_objects] = [true, null, 100];
    const allOrders = [];
    while (hasNextPage===true) {
        const queryRange = endCursor != null ? `first:${n_objects}, after:"${endCursor}"` : `first:${n_objects}`;
        const response = await graphql(
        `
            query getOrders {
                orders(${queryRange}) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            tags
                            closed
                            packagingDate: metafield(namespace: "order_specs", key:"packaging_date") {
                                value
                            }
                            deliveryDate: metafield(namespace: "order_specs", key:"delivery_date") {
                                value
                            }
                        }
                    }
                }
            }
            `,
        );
        const {
            data: { orders },
        } = await response.json();
        let currOrders = orders.edges.map((edge) => edge.node);
        currOrders = currOrders.filter((order) => order.packagingDate == null || order.deliveryDate == null || order.closed == false);
        hasNextPage = orders.pageInfo.hasNextPage;
        endCursor = orders.pageInfo.endCursor;
        allOrders.push(...currOrders);
    }
    if (allOrders.length === 0) return [];
    return Promise.all(
        allOrders.map((order) => metafieldsSet(order, graphql))
    );
}
  
async function metafieldsSet(order, graphql) {
  sleep(5000).then(() => {});
  const { deliveryDateStr, packagingDateStr } = calculateDates(order.tags);

  const response = await graphql(
      `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
              metafields {
                  key
                  namespace
                  value
              }
              userErrors {
                  message
                  elementIndex
              }
          }
      }
      `,
      {
          variables: 
          {
              "metafields": [
                {
                  "key": "delivery_date",
                  "namespace": "order_specs",
                  "ownerId": order.id,
                  "type": "date",
                  "value": deliveryDateStr
                },
                {
                  "key": "packaging_date",
                  "namespace": "order_specs",
                  "ownerId": order.id,
                  "type": "date",
                  "value": packagingDateStr
                }
              ]
            }
      }
  );
  
  const {
    data: { metafieldsSet },
  } = await response.json();
  return {
    "metafields": metafieldsSet.metafields,
    "userErrors": metafieldsSet.userErrors,
  }; 
}

function calculateDates(tags) {
    // Make sure that the data you return matches the
    // shape & types defined in the output schema.
    
    // Calculate packaging date based on delivery date
    const getMonth = (cand) => {
      return ("JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(cand) / 3 + 1);
    }
    const getDeliveryDate = (tags) => {
      for (let i = 0; i<tags.length; i++) {
        let cand = tags[i].split(" ");
        if (getMonth(cand[1]) >= 1) {
          cand[1] = getMonth(cand[1]);
          return (new Date(cand.reverse().join("-")));
        }
      }
      return -1;
    };
    const deliveryToPackagingMapping = {
      // Number of days prior that order must be packaged on
      1: -4, // Delivery day=Mon
      2: -4, // Delivery day=Tues
      3: -5, // Delivery day=Wed
      4: -3, // Delivery day=Thurs
      5: -3, // Delivery day=Fri
      6: -3, // Delivery day=Sat
    };
    const deliveryDate = getDeliveryDate(tags);
    if (deliveryDate == -1) {
        return {
            deliveryDateStr: new Date(null),
            packagingDateStr: new Date(null),
        }
    }
    const deliveryDay = deliveryDate.getDay();
    if (!(deliveryDay in deliveryToPackagingMapping)) {
        return {
            deliveryDateStr: new Date(null),
            packagingDateStr: new Date(null),
        }
    }
    const packagingOffset = deliveryToPackagingMapping[deliveryDay];
    const packagingDate = new Date(new Date(deliveryDate).setDate(deliveryDate.getDate() + packagingOffset));
    return {
      deliveryDateStr: deliveryDate,
      packagingDateStr: packagingDate,
    }
  }