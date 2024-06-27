import { type BlockTag, JsonRpcProvider, Network } from "ethers";

import type { ISwapResponse } from "../common/interfaces.js";
import type { IEncodeOptions } from "../routers/types.js";
import { UniversalRouter } from "../routers/universalRouter/index.js";
import { resolveEncodeOptions } from "../routers/routerBase.js";
import { parse } from "../parser.js";

import orbitToPac10k from './assets/orbitToPac10k.json' assert { type: "json" };
import { SwapSimulation } from "./index.js";

let rpcUrl: string | undefined = process.env.RPC_URL;
if (rpcUrl === undefined || rpcUrl === "") {
    throw new Error(`Failed to find rpc url from environment!`);
};

const chainId = 81457;
const network = { chainId, name: "Blast Mainnet" };
const provider = new JsonRpcProvider(
    rpcUrl,
    network,
    { staticNetwork: Network.from(network) },
);

const routerAddress: string = "0xAA539Bcf648C0b4F8984FcDEb5228827e7AAC3AE";
const tokenProxyAddress: string = "0x000000000022d473030f116ddee9f6b43ac78ba3";
const router = new UniversalRouter(chainId, routerAddress, tokenProxyAddress);

const senderAddress: string = "0x3B2Be8413F34fc6491506B18c530A264c0f7adAE";

const simulateAsync = async (
    caseName: string,
    swapResponse: ISwapResponse,
    encodeOptions: IEncodeOptions,
    blockTag: BlockTag,
): Promise<void> => {

    const routingPlan = parse(swapResponse);

    const calldata = router.encode(routingPlan, encodeOptions);

    const { amountOut } = await SwapSimulation
        .from(blockTag)
        .connect(provider)
        .runAsync(
            senderAddress,
            router.routerAddress,
            router.tokenProxyAddress,
            routingPlan.fromToken,
            routingPlan.toToken,
            routingPlan.amountIn,
            calldata,
        );

    const { amountOutMinimum } = resolveEncodeOptions(routingPlan, encodeOptions);

    if (amountOut < amountOutMinimum) {
        throw new Error(`Case ${caseName} failed as simulated amountOut ${amountOut} is less than amountOutMinimum ${amountOutMinimum}.`);
    }
    
    console.log(`Case '${caseName}' passed simulation!`);
}

await simulateAsync('10k ORBIT to PAC', orbitToPac10k, { slippageTolerance: 0.1 }, 5358636);