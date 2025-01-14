import { useState, useCallback } from "react";

import {
    Card,
    Box,
    Button,
    ChoiceList,
    Divider,
    Tooltip,
    ButtonGroup,
    MediaCard,
    Thumbnail,
    Layout,
    EmptyState,
    Page,
    Icon,
    Popover,
    InlineStack,
    Text,
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";

import { ExportIcon, EditIcon, DeliveryIcon, FlowerFilledIcon, ShippingLabelIcon } from "@shopify/polaris-icons";
import { CSVDownload } from "react-csv";
import "./Font/MarckScript-Regular-normal.js";
import "./Font/NotoSerifTelugu-Regular-normal.js";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

import { dateValidateAndStringify, convertStateNameToAbbrev } from "./utils_functional";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function AlertOrderNote() {
  return (
    <Tooltip dismissOnMouseOut={true} content="This order has a personalized note.">
      <Icon
        source={NoteIcon}
        tone="base"
      />
    </Tooltip>
  );
}

export function PlaceholderAlertOrderNote() {
  return (
    <Tooltip dismissOnMouseOut={true} >
    </Tooltip>
  );
}

export function EditOrderStatusButton({shop, orderId}) {
  const newUrl = `https://admin.shopify.com/store/${shop}/orders/${orderId}`;
  return (
    <a target='_blank'
            rel='noopener noreferrer' href={newUrl} >
    <Button 
      icon={EditIcon}
    >
      Edit order status
    </Button>
    </a>
  );
}


export function EmptyAdminOrderState({message="View order history"}) {
    return(
      <Page fullWidth>
        <ui-title-bar title="Administrative Dashboard">
        </ui-title-bar>
        <Layout>
          <Layout.Section>
            <Card padding="0">
              <EmptyState
                heading="Administrative view of order history"
                id="emptyState"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>{message}</p>
              </EmptyState>
              <InlineStack align="center">
              {message.toLowerCase().includes("loading") 
                ? (
                 
                    <Thumbnail
                      source="https://raw.githubusercontent.com/madisonthantu/about_mgt/gh-pages/assets/the-scheming-admin/loading.jpeg"
                      alt="loading"
                    />
                  
                  )
                : null
              }
              </InlineStack>
              <div style={{ height: '100px' }}></div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

export function ProductCard({lineItem, shop, withMedia=true}) {
    var product = lineItem;
    const getFarmName = (farmName) => {
      if (farmName != null) {
        return(
          <>
            <strong>Farm product name: </strong> {product.farmName}
            <br />
          </>
        )
      }
      return (
        <></>
      )
    }
  
    const computePrice = (originalPrice, discountedPrice, currencyCode) => {
      if (originalPrice === discountedPrice) {
        return currencyCode === "USD" ? `$${originalPrice}` : `${originalPrice} ${currencyCode}`;
      }
      if (currencyCode === "USD") {
        return (
          <>
            <s>${originalPrice}</s> ${discountedPrice}
          </>
        );
      }
      return (
        <>
          <s>{originalPrice} {currencyCode}</s> {discountedPrice} {currencyCode}
        </>
      );
  
    }
    const validSku = () => {
      if (product.sku != '' && product.sku != null && product.sku != " ") {
        return(
          <>
            <strong>SKU: </strong> {product.sku}
            <br />
          </>
        )
      }
      return (
        <></>
      )
    }
    const getColors = (colors) => {
      if (colors != null) {
        return(
          <>
            <strong>Colors: </strong> {colors}
            <br />
          </>
        )
      }
      return (
        <></>
      )
    }
    const prodUrl = `https://admin.shopify.com/store/${shop}/products/${product.productId}`;
    const getLinkedProductTitle = () => (
          <a target='_blank'
                  rel='noopener noreferrer' href={prodUrl}
                  style={{
                    color: 'black'
                  }}
          >
            <Text as="h2" variant="headingSm" tone="base">
              {product.name}
            </Text>
          </a>
    )
    if (!withMedia) {
      return (
        <Card roundedAbove="xs">
          {getLinkedProductTitle()}
          {getFarmName(product.farmName)}
          {getColors(product.colors)}
          <strong>Quantity: </strong> {product.quantity} <br /> 
          {validSku()} 
        </Card>
      );
  }
  const productInfo = () => {
    return(
      <>
        <Text as="p">
          {getFarmName(product.farmName)}
          {getColors(product.colors)}
          <br /> <br />
          <strong>Quantity: </strong> {product.quantity}  <br /> 
          {validSku()}
          <br /> <br />
          <strong>Price: </strong> {computePrice(product.originalPrice, product.discountedPrice, product.currencyCode)}
        </Text> 
      </>
    )
  }
  return (
    <MediaCard
      title={getLinkedProductTitle()}
      description={productInfo()}
      size="small"
    >
      <img
          alt=""
          width="100%"
          height="100%"
          style={{objectFit: 'cover', objectPosition: 'center', overflow: 'hidden', borderColor:'rgb(232,232,232)'}}
          src={product.productImage}
          border="1pt"
        />
    </MediaCard>
  )
}
  
export function PrintNoteButton({orderNote, orderNumber, view="desktop"}) {
    let note = orderNote;
    const [hidden, setHidden] = useState(true);  
    
    function printNote() {
        if (note == null) {
            return null;
        }
        const noteDimensions = {
            "x": 15,
            "y": 10.2,
        }
        var doc = new jsPDF({
            orientation: "landscape",
            unit: "cm",
            format: [noteDimensions["x"], noteDimensions["y"]]
        });
        // https://fonts.google.com/selection
        doc.setFont('NotoSerifTelugu-Regular', 'normal'); 
        
        let fontSize = 12;
        if (note.length <= 150) { fontSize = 18; }
        else if (note.length <= 200) { fontSize = 16; }
        doc.setFontSize(fontSize);
        const noteArray = note.split(/\r?\n/);
        doc.text(noteArray, noteDimensions["x"]*0.5, noteDimensions["y"]*0.35, { align: 'center', maxWidth: noteDimensions["x"]*0.8});
        doc.setFontSize(12);
        doc.text("Order No. " + orderNumber, noteDimensions["x"]*0.05, noteDimensions["y"]*0.95, { align: 'left'});
        doc.autoPrint({variant: 'javascript'});
        var wind = window.open(doc.output('pdfobjectnewwindow'));
        wind.open();
    }
  
    return (
      <div
        className="container"
        onMouseOver={() => setHidden(false)}
        onMouseLeave={() => setHidden(true)}
      > 
        <Tooltip active={!hidden && note == null} content="There is no personalized note associated with this order.">
          <Button  
            icon={FlowerFilledIcon}
            disabled={note == null || view == "mobile"}
            onClick={() => printNote()}
          >
            Print Note
          </Button>
        </Tooltip>
      </div>
    )
}

export function PersonalizedNote(orderNote, orderNumber) {
    let note = orderNote.orderNote;
    let orderNo = orderNumber.orderNumber;
    if (note == null) {
      return null;
    }
    return (
      <>
        <Divider />
        <Text as="p" fontWeight="medium">
          Personalized Message: 
          {note.match(/.{1,30}/g).map((sent, index) => 
            <Text as="p" key={index}>
            {sent}
            </Text>)
          }
        </Text>
        <PrintNoteButton orderNote={note} orderNumber={orderNo}/>
      </>
    )
}

export function PrintShippingInfo({order, view}) {
  const [doExport, setDoExport] = useState(false);

  const HandleExportComponent = ({data, orderNumber, doExport}) => {
    if (!doExport) {
      return (<></>);
    }
    setDoExport(false);
    sleep(5000).then(() => {});
    function convertArrayToWorksheet(array) {
      const worksheet = XLSX.utils.json_to_sheet(array);
      return worksheet;
    }
    // Function to export array of objects to Excel file and download
    function exportToExcel(array, filename) {
        const workbook = XLSX.utils.book_new();
        const worksheet = convertArrayToWorksheet(array);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        saveExcelFile(excelBuffer, filename);
    }
    // Function to save Excel file and trigger download
    function saveExcelFile(buffer, filename) {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } 
        else {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(link.href);
        }
    }
    exportToExcel(data, "shipping-info-" + orderNumber + ".xlsx");
    return (<></>);
  }
  
  return (
    <div> 
      <Button  
        icon={DeliveryIcon}
        onClick={() => setDoExport(true)}
        disabled={view == "mobile"}
      >
        Export Shipping Info
      </Button>
      <HandleExportComponent data={getShippingDataExport(order)} orderNumber={order.orderNumber} doExport={doExport} />
    </div>
  )
}

export function PrintShippingLabelInfo({order, shop, view}) {
    const getShippingLabelInfo = (order) => {
      const orderInfo = getShippingDataExport(order);
      return orderInfo.map(item => ({
        "Order No.": item["Order No."],
        "Name": order.shippingAddress.name.slice(0, 25),
        "Ship date": item["Ship Date"],
        "Quantity": item["Quantity"].toString(),
        "Box Type": item["Box Type"],
        "Variety": item["Variety"].slice(0, 25),
        "No. stems": item["Stems"].toString(),
        "Message": item["Message"],
        "Stone": item["Stone"],
        "Extra Food": item["Extra Food"],
        "Vase Included": item["Vase Included"],
        }));
    }
  
  function printLabelInfo() {
      const noteDimensions = {
          "y": 15,
          "x": 10.2,
      }
      var doc = new jsPDF({
          orientation: "portrait",
          unit: "cm",
          format: [noteDimensions["x"], noteDimensions["y"]]
      });
      // https://fonts.google.com/selection

      const shippingLabelInfo = getShippingLabelInfo(order);
      const fontSize = 12;
      doc.setFontSize(fontSize);
      const maxWidth = noteDimensions["x"]*0.75;
      doc.text(shop.split('-').join(' ').toUpperCase(), noteDimensions["x"]*0.5, noteDimensions["y"]*0.1, { align: 'center', maxWidth: noteDimensions["x"]*0.75, lineHeightFactor: 2});
      for (let i = 0; i < shippingLabelInfo.length; i++) {
        if (i > 0) {
          doc.addPage();
        }
        doc.text(Object.keys(shippingLabelInfo[i]), noteDimensions["x"]*0.1, noteDimensions["y"]*0.2, { align: 'left', maxWidth: maxWidth, lineHeightFactor: 2});
        doc.text(Object.values(shippingLabelInfo[i]), noteDimensions["x"]*0.4, noteDimensions["y"]*0.2, { align: 'left', maxWidth: maxWidth, lineHeightFactor: 2});
      }
      
      doc.autoPrint({variant: 'javascript'});
      var wind = window.open(doc.output('pdfobjectnewwindow'));
      wind.open();
  }

  return (
    <div
      className="container"
      // onMouseOver={() => setHidden(false)}
      // onMouseLeave={() => setHidden(true)}
    > 
      <Button  
          icon={ShippingLabelIcon}
          disabled={ view == "mobile"}
          onClick={() => printLabelInfo()}
        >
          Print Shipping Label Info
        </Button>
    </div>
  )
}

export function GetFormattedShippingAddress({order}) {
  if (order.shippingAddress.name == "No address provided") {
    return (
      <Text>
        {order.shippingAddress.name}
      </Text>
    )
  }
  return (
    <>
      <Text>{order.shippingAddress.name}</Text>
      <Text>{order.shippingAddress.address1}</Text>
      <Text>{order.shippingAddress.address2}</Text>
      <Text>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</Text>
      <Text>{order.shippingAddress.countryCodeV2}</Text>
      <Text>{order.shippingAddress.phone}</Text>
    </>
  )
}

const shippingConstants = {
  "25": {
    "Box Type": "EB",
    "Length": 66,
    "Width": 22,
    "Height": 17,
    "Weight": 4,
    "Valor": 5,
    "Stems": 25
  },
  "50": {
    "Box Type": "EB",
    "Length": 66,
    "Width": 22,
    "Height": 17,
    "Weight": 4,
    "Valor": 10,
    "Stems": 50
  },
  "100": {
    "Box Type": "QB",
    "Length": 66,
    "Width": 34,
    "Height": 20,
    "Weight": 7,
    "Valor": 20,
    "Stems": 100
  },
  "N/A": {
    "Box Type": null,
    "Length": null,
    "Width": null,
    "Height": null,
    "Weight": null,
    "Valor": null,
    "Stems": "N/A"
  },
}

export function getShippingDataExport(order) {
  const nonFlowerItemIds = {
    "food": "9287027622199",
    "stone": "9254861046071",
    "vase": "9135870837047"
  };
  const orderItems = order.lineItems.filter((item) => !Object.values(nonFlowerItemIds).includes(item.productId));
  const includesFood = order.lineItems.some((item) => item.productId === nonFlowerItemIds["food"]);
  const includesStone = order.lineItems.some((item) => item.productId === nonFlowerItemIds["stone"]);
  const includesVase = order.lineItems.some((item) => item.productId === nonFlowerItemIds["vase"]);
  const itemsShippingInfo = []
  for (const element of orderItems) {
    let numStemsIdx = element.name.indexOf(" - ");
    let varietyName = element.farmName ? element.farmName : element.name;
    let numStems = "N/A";
    if (numStemsIdx != -1) {
      numStems = element.name.substring(numStemsIdx + " - ".length).match(/(\d+)/);
      numStems = numStems ? numStems[0] : null;
    }
    const isValidNumStems = ["25", "50", "100"].includes(numStems);
    itemsShippingInfo.push(Object.assign(
      {
        "Ship Date": dateValidateAndStringify(order.packagingDate, 'for-csv-export'),
        "Delivery Date": dateValidateAndStringify(order.deliveryDate, 'for-csv-export'),
        "Name": order.shippingAddress.name,
        "Name ": order.shippingAddress.name,
        "Address 1": order.shippingAddress.address1,
        "Address 2": order.shippingAddress.address2,
        "Address 3":"",
        "City": order.shippingAddress.city,
        "State": convertStateNameToAbbrev(order.shippingAddress.province),
        "Zip Code": order.shippingAddress.zip,
        "Country": order.shippingAddress.countryCodeV2,
        "Telephone": order.shippingAddress.phone,
        "Order No.": order.orderNumber.substring(1),
        "Quantity": 1,
        "Variety": varietyName,
        "Box Type": isValidNumStems ? shippingConstants[numStems]["Box Type"] : "N/A",
        "Length": isValidNumStems ? shippingConstants[numStems]["Length"] : "N/A",
        "Width": isValidNumStems ? shippingConstants[numStems]["Width"] : "N/A",
        "Height": isValidNumStems ? shippingConstants[numStems]["Height"] : "N/A",
        "Weight": isValidNumStems ? shippingConstants[numStems]["Weight"] : "N/A",
        "Valor": isValidNumStems ? shippingConstants[numStems]["Valor"] : "N/A",
        "Stems": isValidNumStems ? shippingConstants[numStems]["Stems"] : numStems,
        "E-mail": order.email,
        "Message": order.orderNote ? "Yes" : "No",
        "Message Text": order.orderNote ? order.orderNote : "",
        "Stone": includesStone ? "Yes" : "No",
        "Extra Food": includesFood ? "Yes" : "No",
        "Vase Included": includesVase ? "Yes" : "No"
      }
    ))
  }
  return itemsShippingInfo;
}

export function ExportOrdersPopover({allOrders, displayedOrders, selectedOrders}) {
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  
  const [exported, setExported] = useState('currentPage');
  const handleExportedChange = useCallback((value) => setExported(value), []);

  const [exportedAs, setExportedAs] = useState('excel');
  const handleExportedAsChange = useCallback((value) => setExportedAs(value), []);

  const [dataType, setDataType] = useState('overview');
  const handleDataTypeChange = useCallback((value) => setDataType(value), []);

  const getExportedData = (exported, dataType) => {
    let data = null;
    if (exported == "currentPage") {
      data = displayedOrders;
    }
    else if (exported == "allOrders") {
      data = allOrders;
    }
    else if (exported == "selectedOrders") {
      data =  allOrders.filter((order) => selectedOrders.includes(order.id));
    }
    else {
      return null;
    }
    if (dataType == "shipping") {
      return data.map(order => getShippingDataExport(order)).flat();
    }
    return data.map(order => ({
        "Order No.": order.orderNumber,
        "Fulfillment Status": order.fulfillmentStatus,
        "Date Created At": dateValidateAndStringify(order.createdAt, 'for-csv-export'),
        "Ship Date": dateValidateAndStringify(order.packagingDate, 'for-csv-export'),
        "Delivery Date": dateValidateAndStringify(order.deliveryDate, 'for-csv-export'),
        "Shipping Address": Object.values(order.shippingAddress).filter((line) => line != "").join(", "),
        "No. Items": order.numItems,
        "Order ID": order.orderId,
        "Confirmation No.": order.confirmationNumber,
        "Canceled": order.isCanceled ? "Yes" : "No",
        "Closed": order.isCanceled ? "Yes" : "No",
        "Message": order.orderNote ? "Yes" : "No",
      }));
  }
  const [doExport, setDoExport] = useState(false);
  
  const HandleExportComponent = ({data, isActive, doExport, exportAs}) => {
    if (!doExport || !isActive) {
      return (<></>);
    }
    setDoExport(false);
    setActive(false);
    sleep(5000).then(() => {});
    if (exportAs == "csv") {
      return (
        <CSVDownload
          data={data}
          separator={";"}
        />
      )
    }
    else if (exportAs == "excel") {
        // Function to convert array of objects to worksheet
        function convertArrayToWorksheet(array) {
            const worksheet = XLSX.utils.json_to_sheet(array);
            return worksheet;
        }

        // Function to export array of objects to Excel file and download
        function exportToExcel(array, filename) {
            const workbook = XLSX.utils.book_new();
            const worksheet = convertArrayToWorksheet(array);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

            saveExcelFile(excelBuffer, filename);
        }

        // Function to save Excel file and trigger download
        function saveExcelFile(buffer, filename) {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename);
            } 
            else {
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                window.URL.revokeObjectURL(link.href);
            }
        }
        exportToExcel(data, new Date().toString().split(' ').join('_') + ".xlsx");
    }
    return (<></>);
  }

  const activator = (
    <Button onClick={toggleActive} icon={ExportIcon} disclosure>
      Export
    </Button>
  );

  return (
    <div>
      <Popover
        active={active}
        activator={activator}
        autofocusTarget="first-node"
        onClose={toggleActive}
        preventCloseOnChildOverlayClick={false}
      >
        <Box padding="200" width='100%'>
          <Popover.Pane>
            <ChoiceList
              title="Export"
              choices={[
                {label: 'Current page', value: 'currentPage'},
                {label: 'All orders', value: 'allOrders'},
                {label: 'Selected', value: 'selectedOrders', disabled: selectedOrders.length === 0},
              ]}
              selected={exported}
              onChange={handleExportedChange}
            />
          </Popover.Pane>
          <Popover.Pane>
            <ChoiceList
              title="Export as"
              choices={[
                {label: 'Excel', value: 'excel'},
                {label: 'CSV', value: 'csv'},
              ]}
              selected={exportedAs}
              onChange={handleExportedAsChange}
            />
          </Popover.Pane>
          <Popover.Pane>
            <ChoiceList
              title="Data"
              choices={[
                {label: 'Order overview data', value: 'overview'},
                {label: 'Order shipping data', value: 'shipping'},
              ]}
              selected={dataType}
              onChange={handleDataTypeChange}
            />
          </Popover.Pane>
          <Popover.Pane>
          <ButtonGroup>
            <Button
              onClick={toggleActive}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={() => setDoExport(true)}
            >
              Export orders
            </Button>
          </ButtonGroup>
        </Popover.Pane>
        </Box>
      </Popover>
      <HandleExportComponent data={getExportedData(exported, dataType)} isActive={active} doExport={doExport} exportAs={exportedAs} />
    </div>
  );
}