import { useState, useCallback, useMemo } from "react";
import { useLoaderData  } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  IndexTable,
  Text,
  Button,
  Box,
  Link,
  InlineStack,
  useIndexResourceState,
  Badge,
  IndexFilters,
  useSetIndexFiltersMode,
  Tag
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

import { getOrdersBriefMobile } from "../models/Order.server";
import { dateValidateAndStringify, getShopName, sortOrdersBy, filterByOrderStatus, getBadgeProgress, getBadgeTone, formatOrderStatus } from "../src/utils_functional";
import { EmptyAdminOrderState, ExportOrdersPopover, AlertOrderNote, PlaceholderAlertOrderNote } from "../src/utils_components";


export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = getShopName(session.shop);
  const adminOrderData = await getOrdersBriefMobile(admin.graphql);
  console.log("\n******************\napp.MOBILE.jsx\n", shop, "\n******************\n");
  return adminOrderData
}


function AdminOrderTableRow({ order, isSelected=false}) {
  const isCancelled = order.isCancelled ? "line-through" : null;
  return (
    <IndexTable.Row
        id={order.id}
        key={order.id}  
        selected={isSelected}
        onClick={() => redirect()}
    >
        <Box padding="400">
            <InlineStack gap="400" wrap={false} blockAlign="center"> 
                <Text variant="bodyMd" alignment="center" textDecorationLine={isCancelled}>
                    <Link url={`../admin_orders/mobile/${order.id}`}>{order.orderNumber}</Link>
                </Text>
                <Badge progress={getBadgeProgress(order.fulfillmentStatus)} tone={getBadgeTone(order.fulfillmentStatus)}>
                    <Text variant="bodyMd" alignment="center" textDecorationLine={isCancelled}>
                        {formatOrderStatus(order.fulfillmentStatus)}
                    </Text>
                </Badge>
                {order.orderNote ? <AlertOrderNote /> : <PlaceholderAlertOrderNote />}
            </InlineStack>
            <Text as="p" textDecorationLine={isCancelled}>
                Confirmation #: {order.confirmationNumber}
            </Text>
            <Box padding="200">
                <Text as="p">
                    <strong>Created at: </strong> {new Date(order.createdAt).toDateString()}
                </Text> 
                <Text as="p">
                    <strong>Customer: </strong> {order.customerName}
                </Text> 
                <Text as="p">
                    <strong>Packaging date: </strong> {dateValidateAndStringify(order.packagingDate)}
                </Text> 
                <Text as="p">
                    <strong>Delivery date: </strong> {dateValidateAndStringify(order.deliveryDate)}
                </Text> 
            </Box>
        </Box>
    </IndexTable.Row>
  )
}

export default function Index() {
  const adminOrders = useLoaderData();
  const itemStrings = [
    'All',
    'Unfulfilled',
    'Fulfilled',
    'Open',
    'Closed'
  ];
  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => useCallback(
      (selectedTabIndex) => {
        setSelectedTab(selectedTabIndex);
      },
      []
    ),
    id: `${item}-${index}`,
    isLocked: index === 0,
    displayedOrders: filterByOrderStatus(adminOrders, item), 
  }));
  const [selectedTab, setSelectedTab] = useState(3);
  const {mode, setMode} = useSetIndexFiltersMode();

  if (adminOrders.length === 0) {
    return (
      <EmptyAdminOrderState message="The order history is currently empty." />
    )
  }
  const sortOptions = [
    {label: 'Packaging Date', value: 'packagingDate asc', directionLabel: 'Ascending'},
    {label: 'Packaging Date', value: 'packagingDate desc', directionLabel: 'Descending'},
    {label: 'Delivery Date', value: 'deliveryDate asc', directionLabel: 'Ascending'},
    {label: 'Delivery Date', value: 'deliveryDate desc', directionLabel: 'Descending'},
    {label: 'Date Created', value: 'createdAtDate asc', directionLabel: 'Ascending'},
    {label: 'Date Created', value: 'createdAtDate desc', directionLabel: 'Descending'},
    {label: 'Order Number', value: 'orderNumber asc', directionLabel: 'Ascending'},
    {label: 'Order Number', value: 'orderNumber desc', directionLabel: 'Descending'},
  ];
  const strSortedDescription = (selectedSort) => {
    let opt = sortOptions.find((element) => element.value == selectedSort)
    return `${opt["label"]}, ${opt["directionLabel"].toLowerCase()}`;
  }
  const initialSortLabel = 'packagingDate asc';
  const [selectedSort, setSelectedSort] = useState([initialSortLabel]);
  const displayedOrders = useMemo(() => {
    return tabs[selectedTab].displayedOrders;
  }, [tabs, selectedTab]);

  const displayedOrdersSorted = useMemo(() => {
    return sortOrdersBy(displayedOrders, selectedSort);
  }, [displayedOrders, selectedSort]);

  const numOrdersPerPage = 25;
  const [currPage, setCurrPage] = useState(0);
  const currPageOrders = useMemo(() => {
    return displayedOrdersSorted.slice(currPage * numOrdersPerPage, (currPage + 1) * numOrdersPerPage);
  }, [displayedOrdersSorted, currPage, numOrdersPerPage]);
  
  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(displayedOrders);
  const handleSelectedTabChange = useCallback((value) => {
    setSelectedTab(value);
    setCurrPage(0);
    handleSelectionChange([]);
  }, [setSelectedTab, setCurrPage, handleSelectionChange]);

  return (
    <Page narrowWidth>
      <ui-title-bar title="Administrative Dashboard">
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <InlineStack align="space-between" blockAlign="center">
              <Box padding="100">
                Showing: 
                <Tag tone='info'>
                    <Button variant="plain">
                        <strong> { tabs[selectedTab].content} </strong> orders
                    </Button>
                </Tag> <br />
                , Sorted by:
                <Tag tone='info'>
                    <Button variant="plain">
                        <strong> { strSortedDescription(selectedSort) } </strong> ...
                    </Button>
                </Tag>
              </Box>
              <Box padding="100">
                <ExportOrdersPopover allOrders={adminOrders} displayedOrders={currPageOrders} selectedOrders={selectedResources} />
              </Box>
            </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <Card padding="0">
            <IndexFilters
              sortOptions={sortOptions}
              sortSelected={selectedSort}
              onSort={setSelectedSort}
              filteringAccessibilityLabel="Filter by ..."
              tabs={tabs}
              selected={selectedTab}
              onSelect={handleSelectedTabChange}
              mode={mode}
              setMode={setMode}
              closeOnChildOverlayClick={true}
              canCreateNewView={false}
              hideQueryField={true}
              filters={[]}
              appliedFilters={[]}
              hideFilters
            />
            <IndexTable
              resourceName={{singular: 'order', plural: 'orders'}}
              itemCount={currPageOrders.length}
              selectable={true}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "" },
                { title: ""},    // Sortable column
              ]}
              pagination={{
                hasNext: (currPage + 1) * numOrdersPerPage < displayedOrdersSorted.length,
                onNext: () => {
                  setCurrPage(currPage + 1);
                },
                hasPrevious: currPage > 0,
                onPrevious: () => {
                  setCurrPage(currPage - 1);
                },
                label: `Showing ${currPage * numOrdersPerPage + 1}-${Math.min((currPage + 1) * numOrdersPerPage, displayedOrdersSorted.length)} of ${displayedOrdersSorted.length} orders`,
              }}
            >
                {currPageOrders.map((order) => (
                    <AdminOrderTableRow order={order} isSelected={selectedResources.includes(order.id)} />
                ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}