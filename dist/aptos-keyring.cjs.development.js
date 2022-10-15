'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var bcUrRegistryAptos = require('@keystonehq/bc-ur-registry-aptos');
var sdk = require('@keystonehq/sdk');
var sdk__default = _interopDefault(sdk);
var bcUrRegistry = require('@keystonehq/bc-ur-registry');
var uuid = require('uuid');
var buffer = require('buffer');

class DefaultInteractionProvider {
  constructor() {
    this.keystoneSDK = undefined;

    this.readCryptoMultiAccounts = async () => {
      const decodedResult = await this.keystoneSDK.read([sdk.SupportedResult.UR_CRYPTO_MULTI_ACCOUNTS], {
        title: "Sync Keystone",
        description: "Please scan the QR code displayed on your Keystone",
        renderInitial: {
          walletMode: "Aptos",
          link: "https://keyst.one/defi"
        },
        URTypeErrorMessage: "The scanned QR code is not the sync code from the Keystone hardware wallet. Please verify the code and try again"
      });

      if (decodedResult.status === sdk.ReadStatus.success) {
        const {
          result
        } = decodedResult;
        return bcUrRegistry.CryptoMultiAccounts.fromCBOR(result.cbor);
      } else {
        throw new Error("Reading canceled");
      }
    };

    this.requestSignature = async (aptosSignRequest, requestTitle, requestDescription) => {
      const status = await this.keystoneSDK.play(aptosSignRequest.toUR(), {
        hasNext: true,
        title: requestTitle,
        description: requestDescription,
        maxFragmentLength: 400
      });
      if (status === sdk.PlayStatus.canceled) throw new Error("#ktek_error[play-cancel]: play canceled");
      const result = await this.keystoneSDK.read([sdk.SupportedResult.UR_APTOS_SIGN_REQUEST], {
        title: "Scan Keystone",
        description: "Please scan the QR code displayed on your Keystone"
      });

      if (result.status === sdk.ReadStatus.canceled) {
        throw new Error("#ktek_error[read-cancel]: read signature canceled");
      } else {
        return bcUrRegistryAptos.AptosSignature.fromCBOR(result.result.cbor);
      }
    };

    if (DefaultInteractionProvider.instance) {
      return DefaultInteractionProvider.instance;
    }

    sdk__default.bootstrap();
    this.keystoneSDK = sdk__default.getSdk();
    DefaultInteractionProvider.instance = this;
  }

}

const keyringType = "QR Hardware Wallet Device";
class BaseKeyring {
  constructor() {
    this.getInteraction = () => {
      throw new Error("KeystoneError#invalid_extends: method getInteraction not implemented, please extend BaseKeyring by overwriting this method.");
    };

    this.type = keyringType;

    this.requestSignature = async (_requestId, signRequest, requestTitle, requestDescription) => {
      const aptosSignature = await this.getInteraction().requestSignature(signRequest, requestTitle, requestDescription);
      const requestIdBuffer = aptosSignature.getRequestId();
      const signature = aptosSignature.getSignature();
      const authPubKey = aptosSignature.getAuthenticationPublicKey();

      if (requestIdBuffer) {
        const requestId = uuid.stringify(requestIdBuffer);

        if (requestId !== _requestId) {
          throw new Error("KeystoneError#invalid_data: read signature error: mismatched requestId");
        }
      }

      return {
        signature,
        authPubKey
      };
    };

    this.getName = () => {
      return this.name;
    }; //common props


    this.keys = [];
    this.name = "QR Hardware";
    this.initialized = false;
    this.device = "";
    this.xfp = "";
  } //initial read


  async readKeyring() {
    const result = await this.getInteraction().readCryptoMultiAccounts();
    this.syncKeyring(result);
  }

  syncKeyring(data) {
    const keys = data.getKeys();
    this.device = data.getDevice();
    this.xfp = data.getMasterFingerprint().toString("hex");
    this.name = data.getKeys()[0].getName();
    this.keys = keys.map((each, index) => ({
      hdPath: each.getOrigin().getPath(),
      pubKey: each.getKey().toString("hex"),
      index
    }));
    this.initialized = true;
  }

  syncKeyringData({
    xfp,
    keys,
    name = "QR Hardware",
    device
  }) {
    this.xfp = xfp;
    this.name = name;
    this.keys = keys;
    this.device = device;
    this.initialized = true;
  }

  getPubKeys() {
    if (!this.initialized) {
      return [];
    }

    return this.keys;
  }

  _ensureHex(hexStr) {
    if (hexStr.startsWith("0x")) {
      return hexStr;
    } else {
      return `0x${hexStr}`;
    }
  }

  async _getSignature(authPubKey, msg, signType, senderAddress, origin) {
    const requestId = uuid.v4();
    const key = this.getPubKeys().find(key => this._ensureHex(key.pubKey) === this._ensureHex(authPubKey));
    const accounts = senderAddress ? [buffer.Buffer.from(this._ensureHex(senderAddress).slice(2))] : [];
    const atosSignRequest = bcUrRegistryAptos.AptosSignRequest.constructAptosRequest(buffer.Buffer.from(msg), [key.hdPath], [this.xfp], signType, requestId, accounts, origin);
    return this.requestSignature(requestId, atosSignRequest, "Scan with your Keystone", 'After your Keystone has signed this message, click on "Scan Keystone" to receive the signature');
  }

  async signMessage(authPubKey, msg, senderAddress, origin) {
    return this._getSignature(authPubKey, msg, bcUrRegistryAptos.SignType.SignMessage, senderAddress, origin);
  }

  async signTransaction(authPubKey, msg, senderAddress, origin) {
    return this._getSignature(authPubKey, msg, bcUrRegistryAptos.SignType.SingleSign, senderAddress, origin);
  }

}
BaseKeyring.type = keyringType;

class DefaultKeyring extends BaseKeyring {
  constructor() {
    super();

    this.getInteraction = () => {
      return new DefaultInteractionProvider();
    };
  }

  static getEmptyKeyring() {
    return new DefaultKeyring();
  }

}
DefaultKeyring.type = BaseKeyring.type;

exports.BaseKeyring = BaseKeyring;
exports.DefaultKeyring = DefaultKeyring;
//# sourceMappingURL=aptos-keyring.cjs.development.js.map
