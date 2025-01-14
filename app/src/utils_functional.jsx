import { compareDesc, compareAsc } from "date-fns";


export function sortOrdersBy(orders, sortString) {
    if (sortString == "packagingDate asc") {
      orders.sort(function(a, b) {
        return compareAsc(a.packagingDate, b.packagingDate);
      });
    }
    else if (sortString == "packagingDate desc") {
      orders.sort(function(a, b) {
        return compareDesc(a.packagingDate, b.packagingDate);
      });
    }
    else if (sortString == "deliveryDate asc") {
      orders.sort(function(a, b) {
        return compareAsc(a.deliveryDate, b.deliveryDate);
      });
    }
    else if (sortString == "deliveryDate desc") {
      orders.sort(function(a, b) {
        return compareDesc(a.deliveryDate, b.deliveryDate);
      });
    }
    else if (sortString == "createdAtDate asc") {
      orders.sort(function(a, b) {
        return compareAsc(a.createdAt, b.createdAt);
      });
    }
    else if (sortString == "createdAtDate desc") {
      orders.sort(function(a, b) {
        return compareDesc(a.createdAt, b.createdAt);
      });
    }
    else if (sortString == "orderNumber asc") {
      orders.sort(function(a, b) {
        return a.orderNumber > b.orderNumber ? 1 : -1;
      });
    }
    else if (sortString == "orderNumber desc") {
      orders.sort(function(a, b) {
        return a.orderNumber > b.orderNumber ? -1 : 1;
      });
    }
    return orders;
}

export function filterByOrderStatus(orders, status="All") {
    if (status == "Unfulfilled") {
      orders = orders.filter((order) => order.fulfillmentStatus !== "FULFILLED" && order.isClosed == false);
    }
    else if (status == "Fulfilled") {
      orders = orders.filter((order) => order.fulfillmentStatus == "FULFILLED");
    }
    else if (status == "Open") {
      orders = orders.filter((order) => order.fulfillmentStatus !== "FULFILLED" && order.isClosed == false && order.isCancelled == false);
    }
    else if (status == "Closed") {
      orders = orders.filter((order) => order.isClosed == true || order.isCancelled == true);
    }
    return sortOrdersBy(orders, "createdAtDate");
}

export function formatCurrency(amount, currencyCode="USD") {
    amount = (Math.round(amount * 100) / 100).toFixed(2);
    amount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let res = currencyCode === "USD" ? `$${amount}` : `${amount} ${currencyCode}`;
    return res;
}

export function formatObjectId(objectId) {
  if (!objectId) return "";
  return objectId.substring(objectId.lastIndexOf("/")+1);
}

export function getShopName(shop) {
  if (!shop) return "";
  return shop.substring(0, shop.indexOf("."));
}

export function renderAddress(address) {
    return address.map((addy, index) => 
        <Text as="p" key={index}>
        {addy}
        </Text>
    );
}

export function getBadgeTone(status) {
  if (status === "UNFULFILLED") {
    return "attention";
  }
  else if (status === "FULFILLED") {
    return "new";
  }
  return "warning";
}

export function getBadgeProgress(status) {
  if (status === "UNFULFILLED") {
    return "incomplete";
  }
  else if (status === "FULFILLED") {
    return "complete";
  }
  return "partiallyComplete";
}

const getColors = (colors) => {
  let colorsStr = "";
  for (let i = 0; i < colors.length; i++) {
    if (colors[i].key.includes("color")) {
      colorsStr += colors[i].value + ", ";
    }
  }
  return colorsStr.slice(0, -2);
}

export function cleanUpOrderDataVerbose(adminOrderData) {
    const adminOrder = adminOrderData.adminOrderData;
    if (adminOrder.shippingAddress == null) {
        adminOrder.shippingAddress = {
            name: "No address provided",
            address1: "",
            address2: "",
            city: "",
            country: "",
            province: "",
            zip: "",
            countryCodeV2: "",
            phone: "",
        };
    }
    const lineItems = adminOrderData.lineItemsData.lineItems.map(
        lineItem => ({
            id: lineItem.id,
            name: lineItem.name,
            productId: formatObjectId(lineItem.product.id),
            sku: lineItem.sku,
            colors: lineItem.colors.length != 0 ? getColors(lineItem.colors) : null,
            farmName: lineItem.product.metafield != null ? lineItem.product.metafield.value : null,
            productImage: lineItem.image.url,
            productAltText: lineItem.image.altText,
            quantity: lineItem.quantity,
            originalPrice: lineItem.originalUnitPriceSet.presentmentMoney.amount,
            discountedPrice: lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount,
            currencyCode: lineItem.originalUnitPriceSet.presentmentMoney.currencyCode,
        }));
    adminOrder.orderSubtotalNoDiscounts = Math.trunc(lineItems.reduce(
        (accumulator, currentValue) => accumulator + currentValue.originalPrice*currentValue.quantity,
        0,
    ));
    adminOrder.numItems = lineItems.reduce(
        (accumulator, currentValue) => accumulator + currentValue.quantity,
        0,
    );
    adminOrder.lineItems = lineItems;
  
    return adminOrder
}

export function cleanUpOrderDataBrief(adminOrderData) {
  const adminOrder = adminOrderData.adminOrderData;
  if (adminOrder.shippingAddress == null) {
    adminOrder.shippingAddress = {
        name: "No address provided",
        address1: "",
        address2: "",
        city: "",
        country: "",
        province: "",
        zip: "",
        countryCodeV2: "",
        phone: "",
    };
  }
  const lineItems = adminOrderData.lineItemsData.lineItems.map(
      lineItem => ({
          id: lineItem.id,
          name: lineItem.name,
          productId: formatObjectId(lineItem.product.id),
          sku: lineItem.sku,
          colors: lineItem.colors.length != 0 ? getColors(lineItem.colors) : null,
          farmName: lineItem.product.metafield != null ? lineItem.product.metafield.value : null,
          quantity: lineItem.quantity,
      }));
  adminOrder.orderSubtotalNoDiscounts = Math.trunc(lineItems.reduce(
      (accumulator, currentValue) => accumulator + currentValue.originalPrice*currentValue.quantity,
      0,
  ));
  adminOrder.numItems = lineItems.reduce(
      (accumulator, currentValue) => accumulator + currentValue.quantity,
      0,
  );
  adminOrder.lineItems = lineItems;

  return adminOrder
}

export function dateValidateAndStringify(date, format=null) {
  if (date.substring(0,10) == "1970-01-01") {
    return "Invalid date";
  }
  const dateObj = new Date(date.substring(0,10)+"T12:12:12");
  if (format == 'en-US') {
    return dateObj.toLocaleDateString('en-US');
  }
  if (format == 'for-csv-export') {
    const month = dateObj.toLocaleString('default', {month: 'short'});
    return [month, dateObj.getDate(), dateObj.getFullYear()].join('/');
  }
  return dateObj.toDateString();
}

export function formatOrderStatus(fulfillmentStatus) {
  return fulfillmentStatus.charAt(0).toUpperCase() + fulfillmentStatus.slice(1).toLowerCase();
}

const SORT_INDEX_TO_LABEL_MAPPING = {
  2: "orderNumber",
  5: "packagingDate",
  6: "deliveryDate",
  7: "createdAtDate",
};

export const SORT_DIRECTION_TO_LABEL_MAPPING = {
  "ascending": "asc",
  "descending": "desc",
};


export function getSelectedSortIndex(selectedSort) {
  for (const [key, value] of Object.entries(SORT_INDEX_TO_LABEL_MAPPING)) {
    if (selectedSort.includes(value)) {
      return key;
    }
  }
}

export function getSelectedSortDirection(selectedSort) {
  for (const [key, value] of Object.entries(SORT_DIRECTION_TO_LABEL_MAPPING)) {
    if (selectedSort.includes(value)) {
      return key;
    }
  }
}

export function getSelectedSortLabel(sortIndex, sortDirection) {
  return SORT_INDEX_TO_LABEL_MAPPING[sortIndex] + " " + SORT_DIRECTION_TO_LABEL_MAPPING[sortDirection];
}


export const convertStateNameToAbbrev = (stateName) => {
  const STATE_NAME_TO_ABBREV_MAPPING = {
    'Arizona': 'AZ',
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY',
  };
  return stateName in STATE_NAME_TO_ABBREV_MAPPING ? STATE_NAME_TO_ABBREV_MAPPING[stateName] : stateName;
}