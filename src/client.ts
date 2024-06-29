import type { ISwapResponse, ITokenPrice, ITokenStaticInfo } from "./common/interfaces.js";
import type { TokenOperation } from "./common/routingPlan.js";

const resolveErrorAsync = async (response: Response): Promise<{ succeeded: boolean; error: any; }> => {
    
    if (response.status === 400 || response.status === 409 || response.status === 500) {
        const { error } = await response.json() as { error: string}
        return {
            succeeded: false,
            error,
        };
    }
    else if (response.status !== 200) {
        let error: string;
        if (response.status >= 500) {
            error = `Unknown server error with code ${response.status}.`;
        }
        else if (response.status >= 400) {
            error = `Unknown client error with code ${response.status}.`;
        }
        else {
            error = `Unknown status code ${response.status}.`;
        }
        return {
            succeeded: false,
            error,
        };
    }

    return {
        succeeded: true,
        error: "",
    };
}

export class SwapnetClient {
    constructor (
        private readonly _apiKey: string,
        private readonly _baseUrl: string = 'https://app.swap-net.xyz',
        private readonly _apiVersion: string = 'v1.0',
    ) {}

    public async getSupportedTokensAsync(
        chainId: number,
    ): Promise<{
        succeeded: true,
        tokens: ITokenStaticInfo[],
    } | {
        succeeded: false,
        error: string,
    }> {

        const url = `${this._baseUrl}/api/${this._apiVersion}/tokens?` +
            `apiKey=${this._apiKey}&` + 
            `chainId=${chainId}`;

        const response = await fetch(url);

        const { succeeded, error } = await resolveErrorAsync(response);
        if (!succeeded) {
            return {
                succeeded,
                error,
            }
        }

        const tokens = (await response.json()) as ITokenStaticInfo[];
        return {
            succeeded,
            tokens,
        }
    }

    public async swapAsync(
        chainId: number,
        sellTokenAddress: string,
        buyTokenAddress: string,
        sellAmount: bigint | undefined,
        buyAmount: bigint | undefined,
        userAddress: string | undefined = undefined,
    ): Promise<{
        succeeded: true,
        swapResponse: ISwapResponse,
    } | {
        succeeded: false,
        error: string,
    }> {

        if (sellAmount === undefined && buyAmount === undefined) {
            throw new Error(`Both sellAmount and buyAmount are missing!`);
        }

        if (sellAmount !== undefined && buyAmount !== undefined) {
            throw new Error(`Both sellAmount and buyAmount are specified!`);
        }

        const url = `${this._baseUrl}/api/${this._apiVersion}/swap?` +
            `apiKey=${this._apiKey}&` +
            `chainId=${chainId}&` +
            `sellToken=${sellTokenAddress}&` +
            `buyToken=${buyTokenAddress}` +
            (sellAmount !== undefined ? `&sellAmount=${sellAmount.toString()}` : "") +
            (buyAmount !== undefined ? `&buyAmount=${buyAmount.toString()}` : "") +
            (userAddress !== undefined ? `&userAddress=${userAddress}` : "");

        const response = await fetch(url);
        const { succeeded, error } = await resolveErrorAsync(response);
        if (!succeeded) {
            return {
                succeeded,
                error,
            }
        }

        const swapResponse = (await response.json()) as ISwapResponse;
        return {
            succeeded,
            swapResponse,
        };
    }

    public async getTokenPricesAsync(
        chainId: number,
        tokenOps: TokenOperation [],
    ): Promise<{
        succeeded: true,
        tokenPrices: ITokenPrice [],
    } | {
        succeeded: false,
        error: string,
    }> {

        const url = `${this._baseUrl}/api/${this._apiVersion}/prices?` +
            `apiKey=${this._apiKey}&` +
            `chainId=${chainId}&` +
            `tokens=${tokenOps.map(o => o.tokenInfo.address).join(',')}`;

        const response = await fetch(url);
        const { succeeded, error } = await resolveErrorAsync(response);
        if (!succeeded) {
            return {
                succeeded,
                error,
            }
        }

        const tokenPrices = (await response.json()) as ITokenPrice [];
        return {
            succeeded,
            tokenPrices,
        }
    }
}
