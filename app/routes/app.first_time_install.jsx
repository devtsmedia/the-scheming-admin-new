import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Banner,
  Page,
  Divider,
  List,
  Text,
} from "@shopify/polaris";

import { firstTimeInstallCheck, defineNewMetafields, getRetroactiveOrderIds, recordFirstTimeInstallation } from "../models/InitializeAdminDashboard.server";
import { getShopName } from "../src/utils_functional";

export async function loader({ request }) {
    const { admin, session, redirect } = await authenticate.admin(request);
    const shop = getShopName(session.shop);
    const firstTimeInstall = firstTimeInstallCheck(shop);
    if (!firstTimeInstall) {
        return redirect("/app");
    }
    const response = {
        "shop": shop,
        "metafieldDefinitionCreate": await defineNewMetafields(admin.graphql),
        "metafieldsSet": await getRetroactiveOrderIds(admin.graphql),
        "addNewStorefront": recordFirstTimeInstallation(shop),
    };
    return {
        "shop": shop,
        "response": response, 
    };
}

export function validateInstallation({response}) {
    const errors = {};
    const metafieldDefErrors = response.metafieldDefinitionCreate.map((err) => err.userErrors).filter((err) => !err[0].message.includes("Key is in use for"));
    if (metafieldDefErrors.length > 0) {
        errors.metafieldDefinitionCreate = metafieldDefErrors;
    }
    const metafieldsSetErrors = response.metafieldsSet.map((err) => err.userErrors).filter((err) => err.length > 0);
    
    if (metafieldsSetErrors.length > 0) {
        errors.metafieldsSet = metafieldsSetErrors;
    }
    if (response.addNewStorefront.success === -1) {
      errors.addNewStoreFront = response.addNewStoreFront.message;
    }
    if (Object.keys(errors).length) {
      return errors;
    }
    return {}
}

function HomeButton() {
    const navigate = useNavigate();
    return (
        <div>
            Process complete!
            <div style={{ height: '25px' }}></div>
            <button onClick={() => navigate("/app")}>
                Go to dashboard
            </button>
        </div>
    );
}

const errorAlert = (errors) => (
    <Banner
      title="Please contact support."
      tone="critical"
    >
        <Text>
            There were errors during the installation process. Please contact support.
        </Text>
        <Divider />
        <Text>
            The errors that occurred include:
                <List type="bullet">
                    {errors.metafieldDefinitionCreate ? <List.Item> Could not create new metafield definitions. {errors.metafieldDefinitionCreate.slice(0, -2)}</List.Item> : null}
                    {errors.metafieldDefinitionCreate
                        ? errors.metafieldsSet.map((msg, index) => (
                            <Text as="p" key={index}>
                                {msg}
                            </Text>))
                        : null
                    }
                    {errors.metafieldsSet ? <List.Item> Could not update metafields for existing orders. </List.Item> : null}
                    {errors.addNewStoreFront ? <List.Item> Could not add the new storefront to the database. </List.Item> : null}
                </List>
        </Text>
    </Banner>
);

export default function FirstTimeInstallPage() {
    const { shop, response } = useLoaderData();
    const errors = validateInstallation({response});

    return (
        <Page title="First Time Installation">
            <Card title="First Time Install">
                <Text as="h5" variant="headingMd">
                    This is the first time you are installing the app for your shop: {shop}.
                </Text>
                <div style={{ height: '25px' }}></div>
                <Text>
                    <p>
                        The app will now install the necessary metafields and update any retroactive orders.
                    </p>
                    <p>
                        This process may take some time, please be patient.
                    </p>
                </Text>
                <div style={{ height: '25px' }}></div>
                {Object.keys(errors).length ? errorAlert(errors) : <HomeButton />}
            </Card> 
        </Page>
    );
}