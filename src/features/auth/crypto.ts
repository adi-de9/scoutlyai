import * as Crypto from "expo-crypto";

type DigestAlgorithm = string | { name?: string };

// Supabase Auth checks globalThis.crypto.subtle before it creates a PKCE
// challenge. Hermes does not provide that browser API, so bridge the Expo SDK
// 57 native implementation before the Supabase client is constructed.
const currentCrypto = globalThis.crypto;
if (!currentCrypto?.subtle) {
  const secureCrypto = {
    getRandomValues: currentCrypto?.getRandomValues
      ? currentCrypto.getRandomValues.bind(currentCrypto)
      : Crypto.getRandomValues,
    subtle: {
      digest: async (algorithm: DigestAlgorithm, data: BufferSource) => {
        const name = typeof algorithm === "string" ? algorithm : algorithm.name;
        if (name?.toUpperCase() !== "SHA-256") {
          throw new Error("Only SHA-256 is supported for mobile PKCE.");
        }
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
      },
    },
  };
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: secureCrypto,
  });
}
