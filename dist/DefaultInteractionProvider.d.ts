import { AptosSignature, AptosSignRequest } from "@keystonehq/bc-ur-registry-aptos";
import { InteractionProvider } from "./InteractionProvider";
import { CryptoMultiAccounts } from "@keystonehq/bc-ur-registry";
export declare class DefaultInteractionProvider implements InteractionProvider {
    private static instance;
    private keystoneSDK;
    constructor();
    readCryptoMultiAccounts: () => Promise<CryptoMultiAccounts>;
    requestSignature: (aptosSignRequest: AptosSignRequest, requestTitle?: string, requestDescription?: string) => Promise<AptosSignature>;
}
