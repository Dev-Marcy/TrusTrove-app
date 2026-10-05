import { test as base } from "@playwright/test";

type FreighterFixtures = {
  skipOnboardingTour: boolean;
};

// Extend basic test by providing a mocked freighter window object
export const test = base.extend<FreighterFixtures>({
  skipOnboardingTour: [true, { option: true }],
  page: async ({ page, skipOnboardingTour }, use) => {
    await page.addInitScript((skipTour) => {
      if (skipTour) {
        window.localStorage.setItem("trusttrove:onboarding-tour-seen", "true");
      }

      window.freighter = {
        isConnected: () => Promise.resolve(true),
        isAllowed: () => Promise.resolve(true),
        setAllowed: () => Promise.resolve(),
        requestAccess: () => Promise.resolve(""),
        signTransaction: (xdr: string) => Promise.resolve(xdr),
        signAuthEntry: () => Promise.resolve("signed-auth-mock"),
        getPublicKey: () =>
          Promise.resolve(
            "GBMOCKWALLETADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          ),
        getNetworkDetails: () => Promise.resolve({ network: "TESTNET" }),
      };

      window.addEventListener("message", (event: MessageEvent) => {
        const request = event.data as {
          source?: string;
          messageId?: number;
          type?: string;
          transactionXdr?: string;
          entryXdr?: string;
        };
        if (request.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;

        let response: Record<string, unknown> = {};
        switch (request.type) {
          case "REQUEST_ACCESS":
          case "REQUEST_PUBLIC_KEY":
            response = {
              publicKey:
                "GBMOCKWALLETADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            };
            break;
          case "REQUEST_NETWORK_DETAILS":
            response = {
              networkDetails: {
                network: "TESTNET",
                networkName: "Test SDF Network ; September 2015",
                networkUrl: "https://horizon-testnet.stellar.org",
                networkPassphrase: "Test SDF Network ; September 2015",
                sorobanRpcUrl: "https://soroban-testnet.stellar.org",
              },
            };
            break;
          case "SUBMIT_TRANSACTION":
            response = { signedTransaction: request.transactionXdr ?? "" };
            break;
          case "SUBMIT_AUTH_ENTRY":
            response = { signedAuthEntry: request.entryXdr ?? "" };
            break;
          case "REQUEST_CONNECTION_STATUS":
            response = { isConnected: true };
            break;
          case "REQUEST_ALLOWED_STATUS":
          case "SET_ALLOWED_STATUS":
            response = { isAllowed: true };
            break;
          case "REQUEST_NETWORK":
            response = { network: "TESTNET" };
            break;
          case "REQUEST_USER_INFO":
            response = {
              userInfo: {
                publicKey:
                  "GBMOCKWALLETADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
              },
            };
            break;
        }

        window.postMessage(
          {
            source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
            messagedId: request.messageId,
            ...response,
          },
          window.location.origin,
        );
      });
    }, skipOnboardingTour);
    await use(page);
  },
});
