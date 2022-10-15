/// <reference types="node" />
import { InteractionProvider } from "./InteractionProvider";
import { CryptoMultiAccounts } from "@keystonehq/bc-ur-registry";
import { AptosSignRequest, SignType } from "@keystonehq/bc-ur-registry-aptos";
import { Buffer } from "buffer";
export interface HDKey {
    hdPath: string;
    pubKey: string;
    index: number;
}
interface KeyringInitData {
    xfp: string;
    keys: HDKey[];
    name?: string;
    device?: string;
}
export declare class BaseKeyring {
    getInteraction: () => InteractionProvider;
    static type: string;
    protected xfp: string;
    protected type: string;
    protected initialized: boolean;
    protected keys: HDKey[];
    protected name: string;
    protected device: string;
    constructor();
    protected requestSignature: (_requestId: string, signRequest: AptosSignRequest, requestTitle?: string, requestDescription?: string) => Promise<{
        signature: Buffer;
        authPubKey: Buffer;
    }>;
    readKeyring(): Promise<void>;
    syncKeyring(data: CryptoMultiAccounts): void;
    syncKeyringData({ xfp, keys, name, device }: KeyringInitData): void;
    getName: () => string;
    getPubKeys(): HDKey[];
    _ensureHex(hexStr: any): any;
    _getSignature(authPubKey: string, msg: Uint8Array, signType: SignType, senderAddress?: string, origin?: string): Promise<{
        signature: Buffer;
        authPubKey: Buffer;
    }>;
    signMessage(authPubKey: string, msg: Uint8Array, senderAddress?: string, origin?: string): Promise<{
        signature: Buffer;
        authPubKey: Buffer;
    }>;
    signTransaction(authPubKey: string, msg: Uint8Array, senderAddress?: string, origin?: string): Promise<{
        signature: Buffer;
        authPubKey: Buffer;
    }>;
}
export {};
