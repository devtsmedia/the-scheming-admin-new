import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Box,
  Divider,
  InlineGrid,
  InlineStack,
  BlockStack,
  Layout,
  Button,
  Page,
  Badge,
  Text,
  Scrollable,
} from "@shopify/polaris";
import { PrintIcon } from "@shopify/polaris-icons";

import { getOrderVerbose } from "../models/Order.server";
import { formatCurrency, getShopName, formatObjectId, cleanUpOrderDataVerbose, getBadgeTone, getBadgeProgress, dateValidateAndStringify } from "../src/utils_functional";
import { PrintShippingLabelInfo, EditOrderStatusButton, ProductCard, PrintNoteButton, PersonalizedNote, PrintShippingInfo, EmptyAdminOrderState, GetFormattedShippingAddress } from "../src/utils_components";

export async function loader({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const orderID = `gid://shopify/Order/${params.id}`;
  return {
    "adminOrderData": await getOrderVerbose(orderID, admin.graphql),
    "shop": getShopName(session.shop),
    "view": params.view,
  };
}

export default function AdminOrderPage() {
  const { adminOrderData, shop, view } = useLoaderData();
  if (adminOrderData == null) {
    return (
      <EmptyAdminOrderState message="Loading the order information. A refresh may be necessary." />
    )
  }
  const adminOrder = cleanUpOrderDataVerbose(adminOrderData);
  const lineItems = adminOrder.lineItems;
  const navigate = useNavigate();

  const SpacingBackground = ({children}) => {
    return (
      <div
        style={{
          height: 'auto',
        }}
      >
        {children}
      </div>
    );
  };

  const AdminActionsSpacing = ({
    children,
    width = 'auto%',
  }) => {
    return (
      <div
        style={{
          width,
          height: 'auto',
          justifyContent:'center', 
          alignItems:'center',
          textAlign:'center',
        }}
      >
        {children}
      </div>
    );
  };

  const homePage = `/app/${view}`;

  const GetButtonGroup = () => {
    if (view == 'mobile') {
      return (
        <BlockStack gap="50" inlineAlign='start'>
          <Button variant="plain" onClick={() => navigate(homePage)}>
            Go back
          </Button>
          <EditOrderStatusButton shop={shop} orderId={formatObjectId(adminOrder.orderId)} />
          <PrintNoteButton orderNote={adminOrder.orderNote} orderNumber={adminOrder.orderNumber} view={view} />
          <PrintShippingLabelInfo order={adminOrder} shop={shop} view={view} />
          <PrintShippingInfo order={adminOrder} view={view} />
        </BlockStack>
      )
    }
    return (
      <InlineGrid columns={4}>
        <EditOrderStatusButton shop={shop} orderId={formatObjectId(adminOrder.orderId)} />
        <PrintNoteButton orderNote={adminOrder.orderNote} orderNumber={adminOrder.orderNumber} />
        <PrintShippingLabelInfo order={adminOrder} shop={shop} />
        <PrintShippingInfo order={adminOrder} />
      </InlineGrid>
    )
  }

  return (
    <Page
      id="order"
      title={`Order ${adminOrder.orderNumber}`}
      titleMetadata={<Badge progress={getBadgeProgress(adminOrder.fulfillmentStatus)} tone={getBadgeTone(adminOrder.fulfillmentStatus)}>{adminOrder.fulfillmentStatus}</Badge>}
      secondaryActions={[{
        content: 'Print page',
        icon: PrintIcon,
        onClick: () => window.print(),
      }]}
    >
      <ui-title-bar title={`Order ${adminOrder.orderNumber}`}>
        <button variant="breadcrumb" onClick={() => navigate(homePage)}>
          Administrative Dashboard
        </button>
      </ui-title-bar>
      <SpacingBackground>
        <BlockStack gap="500">
          {/* https://polaris.shopify.com/tokens/color */}
          <Card title="Admin Actions" background="bg-surface-info-active">
            <AdminActionsSpacing>
              <GetButtonGroup />
            </AdminActionsSpacing>
          </Card>
          
          <Layout>
            <Layout.Section variant="oneThird">
              <Text as="h2" variant="headingLg">
                Order Details
              </Text>
              <div style={{ height: '10px' }}> </div>
              <Card title="Order details">
                <BlockStack gap="500">
                  <Text as="p" fontWeight="medium">
                    Fulfillment status: 
                    <Text>{adminOrder.fulfillmentStatus}</Text>
                  </Text> 
                  <Divider />
                  <Text as="p" fontWeight="medium">
                    Packaging Date: 
                    <Text>{dateValidateAndStringify(adminOrder.packagingDate)}</Text>
                  </Text>
                  <Divider />
                  <Text as="p" fontWeight="medium">
                    Delivery Date: 
                    <Text>{dateValidateAndStringify(adminOrder.deliveryDate)}</Text>
                  </Text>
                  <Divider />
                  <Text as="p" fontWeight="medium">
                    Date Placed: 
                    <Text>{new Date(adminOrder.createdAt).toDateString()}</Text>
                  </Text>
                  <Divider />
                  <Text as="p" fontWeight="medium">
                    Confirmation No.: 
                    <Text>{adminOrder.confirmationNumber}</Text>
                  </Text> 
                  <Divider />
                  <Text as="p" fontWeight="medium">
                    Shipping Address: 
                    <GetFormattedShippingAddress order={adminOrder} />
                  </Text> 
                  <PersonalizedNote orderNote={adminOrder.orderNote} orderNumber={adminOrder.orderNumber} />
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section>
              <Text as="h2" variant="headingLg">
                Product Details
              </Text>
              <div style={{ height: '10px' }}> </div>
              <Scrollable>
                <Card title="Order items" sectioned>
                  {lineItems.map((lineItem, index) => {
                    return (
                      <ProductCard lineItem={lineItem} shop={shop} key={index} />
                    );
                  })}
                  <div style={{ height: '15px' }}></div>
                  <Box padding="600">
                    <BlockStack gap="500" align="center">
                      <InlineStack as="span" align='space-between'>
                        <Text as="p" alignment="left">Subtotal</Text>
                        <Text as="p" alignment="left">{adminOrder.numItems} item{adminOrder.numItems > 1 ? "s" : ""}</Text>
                        <Text as="p" alignment="right">{formatCurrency(adminOrder.orderSubtotalNoDiscounts, adminOrder.currencyCode)}</Text>
                      </InlineStack>
                      <InlineStack as="span" align='space-between'>
                          <Text alignment="left">Discount</Text>
                          <Text alignment="left">{adminOrder.discountCodes.map((code, index) => {
                              return (
                                <p> {code} </p>
                              );
                            })}
                          </Text>
                          <Text alignment="right">{adminOrder.orderDiscountAmount != '0.0' ? '-' : null}{formatCurrency(adminOrder.orderDiscountAmount, adminOrder.currencyCode)}</Text>
                      </InlineStack>
                      <InlineStack as="span" align='space-between'>
                        <Text alignment="left">Shipping</Text>
                        <Text alignment="center"></Text>
                        <Text alignment="right">{formatCurrency(adminOrder.shippingCost, adminOrder.currencyCode)}</Text>
                      </InlineStack> 
                      <InlineStack as="span" align='space-between'>
                        <Text alignment="left">Taxes</Text>
                        <Text alignment="center"></Text>
                        <Text alignment="right">{formatCurrency(adminOrder.taxCost, adminOrder.currencyCode)}</Text>
                      </InlineStack>
                      <Divider />
                      <InlineStack as="span" align='space-between'>
                        <Text alignment="left">Total</Text>
                        <Text alignment="center"></Text>
                        <Text alignment="right">{formatCurrency(adminOrder.orderTotal, adminOrder.currencyCode)}</Text>
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </Card>
              </Scrollable>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </SpacingBackground>
      <div style={{ height: '100px' }}></div>
    </Page>
  );
}
