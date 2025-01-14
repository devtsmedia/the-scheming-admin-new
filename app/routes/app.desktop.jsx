import { useState, useCallback, useMemo } from "react";
import { useLoaderData  } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  IndexTable,
  Text,
  Button,
  BlockStack,
  Box,
  Icon,
  Link,
  InlineStack,
  useIndexResourceState,
  Badge,
  useBreakpoints,
  IndexFilters,
  useSetIndexFiltersMode,
  Banner,
  Divider,
  Tag
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronRightIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

import { getOrdersBrief } from "../models/Order.server";
import { dateValidateAndStringify, getShopName, cleanUpOrderDataBrief, sortOrdersBy, filterByOrderStatus, getSelectedSortIndex, getSelectedSortDirection, getSelectedSortLabel, formatObjectId, getBadgeProgress, getBadgeTone, formatOrderStatus } from "../src/utils_functional";
import { PrintShippingLabelInfo, getShippingDataExport, AlertOrderNote, EmptyAdminOrderState, ExportOrdersPopover, PrintNoteButton, PersonalizedNote, PrintShippingInfo, EditOrderStatusButton, ProductCard, GetFormattedShippingAddress } from "../src/utils_components";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = getShopName(session.shop);
  console.log("\n******************\napp.DESKTOP.jsx\n", shop, "\n******************\n");
  return {
    "adminOrderData": await getOrdersBrief(admin.graphql),
    "shop": shop,
  }
}

const ExpandedRow = ({order, shop}) => (
    <IndexTable.Row
      key={`${order.id}-expanded`}
      id={`${order.id}-expanded`}
      disabled={true}
    >
      <IndexTable.Cell colSpan={8}>
        <Card>
        <div style={{ height: '15px' }}></div>
          <InlineStack align="space-evenly">
            <EditOrderStatusButton shop={shop} orderId={formatObjectId(order.orderId)} />
            <PrintNoteButton orderNote={order.orderNote} orderNumber={order.orderNumber} />
            <PrintShippingLabelInfo order={order} shop={shop} />
            <PrintShippingInfo order={order} />
          </InlineStack>
          <div style={{ height: '25px' }}></div>
          <InlineStack align="space-evenly" as="div">
            <Box padding="200" as="span" width='40%'>
              <Text variant="headingMd" as="h6">
                Order Details
              </Text>
              <div style={{ height: '15px' }}></div>
              <Card>
              <BlockStack gap="100">
                <Text as="p">
                  <strong>Fulfillment status: </strong> {order.fulfillmentStatus}
                </Text> 
                <Divider />
                <Text as="p">
                  <strong>Packaging Date: </strong> 
                  {dateValidateAndStringify(order.packagingDate)}
                </Text> 
                <Divider />
                <Text as="p">
                  <strong>Delivery Date: </strong> 
                  {dateValidateAndStringify(order.deliveryDate)}
                </Text> 
                <Divider />
                <Text as="p">
                  <strong>Date Placed: </strong> {new Date(order.createdAt).toDateString()}
                </Text> 
                <Divider />
                <Text as="p">
                  <strong>Confirmation No.: </strong> {order.confirmationNumber}
                </Text> 
                <Divider />
                <Text as="p">
                  <strong>Shipping Address: </strong>
                  <GetFormattedShippingAddress order={order} />
                </Text>
                <PersonalizedNote orderNote={order.orderNote} orderNumber={order.orderNumber}/>
              </BlockStack>
              </Card>
            </Box>
            <Box padding="200" as="span" width='40%'>
              <Text variant="headingMd" as="h6">
                Product Details
              </Text>
              <div style={{ height: '15px' }}></div>
              <BlockStack gap="50">
                {order.lineItems.map((lineItem, index) => {
                  return (
                    <ProductCard lineItem={lineItem} shop={shop} withMedia={false} />
                  );
                })}
              </BlockStack>
            </Box>
          </InlineStack>
          <div style={{ height: '15px' }}></div>
        </Card>
      </IndexTable.Cell>
    </IndexTable.Row>
  );


function AdminOrderTableRow({ order, shop, isSelected=false, isSmallScreen=false}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCancelled = order.isCancelled ? "line-through" : null;
  const firstRow = (
    <IndexTable.Row 
      id={order.id}
      key={order.id}  
      selected={isSelected}
      onClick={() => redirect()}
    >
      <IndexTable.Cell flush={true}>
        {isSmallScreen == false 
          ? (
            <Button 
              onClick={() => setIsExpanded(!isExpanded)}
              variant="plain"
            >
              <Icon
                source={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                tone="base"
              />
            </Button>)
        : (
            <Button 
              onClick={() => setIsExpanded(!isExpanded)}
              variant="plain"
              disabled
            >
              <Icon
                source={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                tone="base"
              />
            </Button>)
        }
      </IndexTable.Cell>
      <IndexTable.Cell flush={true}>
        {order.orderNote ? <AlertOrderNote /> : null}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" alignment="center" textDecorationLine={isCancelled}>
          <Link url={`../admin_orders/desktop/${order.id}`}>{order.orderNumber}</Link>
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge progress={getBadgeProgress(order.fulfillmentStatus)} tone={getBadgeTone(order.fulfillmentStatus)}>
            <Text variant="bodyMd" alignment="center" textDecorationLine={isCancelled}>
                {formatOrderStatus(order.fulfillmentStatus)}
            </Text>
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" textDecorationLine={isCancelled}>
          {order.confirmationNumber}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" textDecorationLine={isCancelled}>
          {dateValidateAndStringify(order.packagingDate)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" textDecorationLine={isCancelled}>
          {dateValidateAndStringify(order.deliveryDate)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" textDecorationLine={isCancelled}>
          {new Date(order.createdAt).toDateString()}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" textDecorationLine={isCancelled}>
          {order.customerName}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
  const expandedRow = isExpanded ? ExpandedRow({order, shop}) : null;
  return [firstRow, expandedRow]
}

export default function Index() {
  const { adminOrderData, shop } = useLoaderData();
  if (adminOrderData == null) {
    return (
      <EmptyAdminOrderState message="Loading the order history. A refresh may be necessary." />
    )
  }
  const adminOrders = adminOrderData.map((data) => cleanUpOrderDataBrief(data));
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
  const initialSortLabel = 'orderNumber desc';
  const [selectedSort, setSelectedSort] = useState([initialSortLabel]);
  const [sortIndex, setSortIndex] = useState(getSelectedSortIndex(initialSortLabel));
  const [sortDirection, setSortDirection] = useState(getSelectedSortDirection(initialSortLabel));
  const sortToggleLabels = { //2, 5, 6, 7
    2: {ascending: 'Ascending', descending: 'Descending'}, // Order No.
    5: {ascending: 'Ascending', descending: 'Descending'}, // Packaging Date
    6: {ascending: 'Ascending', descending: 'Descending'}, // Delivery Date
    7: {ascending: 'Ascending', descending: 'Descending'}, // Date Placed
  };
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

  const handleClickSortFilter = useCallback((value) => {
    setSelectedSort(value);
    setSortIndex(getSelectedSortIndex(value[0]));
    setSortDirection(getSelectedSortDirection(value[0]));
  }, [setSelectedSort, setSortIndex, setSortDirection]);
  const handleClickSortHeading = useCallback((index, direction) => {
    setSelectedSort([getSelectedSortLabel(index, direction)]);
    setSortIndex(index);
    setSortDirection(direction);
  }, [setSelectedSort, setSortIndex, setSortDirection]);
  
  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(displayedOrders);
  const handleSelectedTabChange = useCallback((value) => {
    setSelectedTab(value);
    setCurrPage(0);
    handleSelectionChange([]);
  }, [setSelectedTab, setCurrPage, handleSelectionChange]);

  return (
    <Page >
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
                </Tag>
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
              sortDirection={sortDirection}
              onSort={handleClickSortFilter}
              filteringAccessibilityLabel="Filter by ..."
              tabs={tabs}
              selected={selectedTab}
              onSelect={handleSelectedTabChange}
              mode={mode}
              setMode={setMode}
              closeOnChildOverlayClick={true}
              canCreateNewView={false}
              hideQueryField={true}
              filters={[]} //{filters}
              appliedFilters={[]} //{appliedFilters}
              hideFilters
            />
            <IndexTable
              condensed={useBreakpoints().smDown}
              resourceName={{singular: 'order', plural: 'orders'}}
              itemCount={currPageOrders.length}
              selectable={true}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "", flush:true },
                { title: "", flush:true },
                { title: "Order No.", alignment:"center" },    // Sortable column
                { title: "Fulfillment Status" },
                { title: "Confirmation No." },
                { title: "Packaging Date" },                  // Sortable column
                { title: "Delivery Date" },                   // Sortable column
                { title: "Date Placed" },                     // Sortable column
                { title: "Customer"}
              ]}
              sortable={[false, false, true, false, false, true, true, true, false]}
              sortDirection={sortDirection}
              sortColumnIndex={sortIndex}
              onSort={handleClickSortHeading}
              sortToggleLabels={sortToggleLabels}
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
                <AdminOrderTableRow order={order} isSelected={selectedResources.includes(order.id)} shop={shop} key={`${order.id}-expanded`} />
                ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}