import { useState, useCallback } from "react";
import { useLoaderData  } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  Text,
  Button,
  BlockStack,
  Link,
  InlineStack,
  Thumbnail,
  Box,
  Divider,
} from "@shopify/polaris";

import { RefreshIcon } from "@shopify/polaris-icons";

import { authenticate } from "../shopify.server";
import { firstTimeInstallCheck } from "../models/InitializeAdminDashboard.server";
import { getShopName } from "../src/utils_functional";

export async function loader({ request }) {
  const { session, redirect } = await authenticate.admin(request);
  const shop = getShopName(session.shop);
  const firstTimeInstall = firstTimeInstallCheck(shop);
  if (firstTimeInstall) {
    return redirect("app/first_time_install");
  }
  return {
    "shop": shop,
  };
}


export default function Index() {
  const { shop } = useLoaderData();
  const [selectedView, setSelectedView] = useState(undefined);
  const handleSelectedView = useCallback((value) => {
    return setSelectedView(value);
  }, [setSelectedView]);

  return (
    <Page >
      <ui-title-bar title="Administrative Dashboard">
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="800" roundedAbove="sm">
            <BlockStack gap="400" center="center">
              <Text as="h5" variant="headingLg" fontWeight="regular" tone="base">
                  Welcome to the <strong>Scheming-Admin</strong>, the administrative dashboard for <strong>{shop}</strong>.
              </Text>
              <Box padding="400">
                <InlineStack align="center">
                  <Thumbnail 
                    alt="the Scheming Admin" 
                    size="large" 
                    source="https://raw.githubusercontent.com/madisonthantu/about_mgt/gh-pages/assets/the-scheming-admin/favicon-no-background.png"
                  />
                </InlineStack>
              </Box>
              <Divider />
              <Text as="h2" variant="headingMd" fontWeight="regular" tone="base">
                  Please select the device you are using to access the dashboard:
              </Text>
              <InlineStack align="space-evenly">
                <Button 
                    size="large"
                    onClick={() => handleSelectedView("desktop")}
                    loading={selectedView === "desktop"}
                  >
                    {selectedView != "desktop"
                      ? (<Text variant="bodyLg" alignment="center">
                          <Link url={`desktop`}>Desktop</Link>
                        </Text>)
                      : null
                    }
                </Button>
                <Button 
                    size="large"
                    onClick={() => handleSelectedView("mobile")}
                    loading={selectedView === "mobile"}
                  >
                    {selectedView != "mobile" 
                      ? (<Text variant="bodyLg" alignment="center">
                          <Link url={`mobile`}>Mobile</Link>
                        </Text>)
                      : null
                    }
                </Button>
              </InlineStack>
            </BlockStack>
            {selectedView == null
            ? null
            : (
              <>
                <div style={{ height: '100px' }}></div>
                <Button 
                  variant="plain" 
                  onClick= {() => window.location.reload()}//{() => navigate('/app')}
                  icon={RefreshIcon}
                >
                  Refresh
                </Button>
              </>
              )
            }
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}