// https://choosealicense.com/licenses/lgpl-3.0/
// inspiration from https://github.com/ChainSafe/web3-context

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import Onboard from 'bnc-onboard';
import {
  API as OnboardApi,
  Wallet,
  Initialization,
} from 'bnc-onboard/dist/src/interfaces';
import { ethers, providers } from 'ethers';
import {NETWORK} from 'libs/constants';

export type OnboardConfig = Partial<Omit<Initialization, 'networkId'>>;

type Web3ContextProps = {
    cacheWalletSelection?: boolean;
    children: React.ReactNode;
    networkIds?: number[];
    onboardConfig?: OnboardConfig;
};

type OnboardContext = {
    isReady: boolean;
    isMobile: boolean;
    onboard?: OnboardApi;
    checkIsReady(): Promise<boolean>;
    resetOnboard(): void;
    handleConnect(): void;
};

type Web3Context = {
    account?: string;
    signer?: ethers.Signer;
    gasPrice?: number;
    network?: NETWORK;
    wallet?: Wallet;
    blockNumber: number;
    provider?: providers.JsonRpcProvider;
    unsupportedNetworkPopupRef: React.MutableRefObject<string>;
};

const Web3Context = createContext<Web3Context | undefined>(undefined);
const OnboardContext = createContext<OnboardContext | undefined>(undefined);

const DEFAULT_NETWORK = NETWORK.MAINNET;

/**
 * Handles connection through BlockNative Onboard library
 */
const Web3Store: React.FC<Web3ContextProps> = ({
    children,
    onboardConfig,
    networkIds,
    cacheWalletSelection = true,
}) => {
    const [account, setAccount] = useState<string | undefined>(undefined);
    const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
    const [network, setNetwork] = useState<NETWORK | undefined>(undefined);
    const [provider, setProvider] = useState<providers.JsonRpcProvider | undefined>(undefined);
    const [blockNumber, setBlockNumber] = useState<number>(0);
    const [gasPrice, setGasPrice] = useState<number>(0);
    const [wallet, setWallet] = useState<Wallet | undefined>(undefined);
    const [onboard, setOnboard] = useState<OnboardApi | undefined>(undefined);
    const [isReady, setIsReady] = useState<boolean>(false);

    const usingDefaultProvider = useRef(true);
    const unsupportedNetworkPopupRef = useRef<string>('');

    // Initialize OnboardJS
    useEffect(() => {
        const initializeOnboard = async () => {
            const checks = [{ checkName: 'accounts' }, { checkName: 'connect' }];
            try {
                const onboard = Onboard({
                    ...onboardConfig,
                    networkId: networkIds ? networkIds[0] : DEFAULT_NETWORK, //Default to arb
                    walletCheck: checks,
                    subscriptions: {
                        address: (address) => {
                            console.info(`Changing address: ${address}`);
                            setAccount(address);
                            onboardConfig?.subscriptions?.address && onboardConfig?.subscriptions?.address(address);
                        },
                        wallet: (wallet) => {
                            console.debug('Detected wallet change');
                            if (wallet.provider) {
                                console.debug('Setting wallet provider');
                                if (wallet.name && cacheWalletSelection) {
                                    window.localStorage.setItem('onboard.selectedWallet', wallet.name);
                                }
                                const provider_ = new ethers.providers.Web3Provider(wallet.provider, 'any');
                                console.debug('Waiting for injected wallet provider');
                                provider_.ready.then(() => {
                                    console.debug('Injected wallet provider ready');
                                    console.debug('Setting injected wallet provider', provider_);
                                    setWallet(wallet);
                                    usingDefaultProvider.current = false;
                                    setProvider(provider_);
                                    if (provider_?.network.chainId) {
                                      if (NETWORK[provider_.network.chainId]) {
                                        setNetwork(provider_.network.chainId)
                                      } else {
                                        setNetwork(NETWORK.UNKNOWN)
                                      }
                                    }
                                });
                            } else {
                                setWallet(undefined);
                            }
                            onboardConfig?.subscriptions?.wallet && onboardConfig.subscriptions.wallet(wallet);
                        },
                        network: (network) => {
                            if (!networkIds || networkIds.includes(network)) {
                                onboard.config({ networkId: network });
                            }
                            console.info(`Changing network ${network}`);
                            const network_ = network;
                            if (NETWORK[network_]) {
                              setNetwork(network_)
                            } else {
                              setNetwork(NETWORK.UNKNOWN)
                            }
                            onboardConfig?.subscriptions?.network && onboardConfig.subscriptions.network(network);
                        },
                    },
                });

                const savedWallet = window.localStorage.getItem('onboard.selectedWallet');
                if (cacheWalletSelection && savedWallet) {
                    (async () => {
                        await onboard.walletSelect(savedWallet);
                        await onboard.walletCheck();
                        setOnboard(onboard);
                    })();
                } else {
                    setOnboard(onboard);
                }
            } catch (error) {
                console.error('Error initializing onboard', error);
            }
        };

        initializeOnboard();
    }, []);

    // useEffect(() => {
        // let mounted = true;
        // const waitForDefaultProvider = async () => {
            // if (DEFAULT_WSS_RPC) {
                // const provider_ = new ethers.providers.WebSocketProvider(DEFAULT_WSS_RPC);
                // websocket providers need to initiate
                // console.debug('Waiting for provider', provider_.ready);
                // await provider_.ready;
                // console.debug('Provider ready, setting provider', usingDefaultProvider.current);
                // if (usingDefaultProvider.current) {
                    // if the provider has not been set by onboard
                    // if (mounted) {
                        // setNetwork(DEFAULT_NETWORK);
                        // setProvider(provider_);
                    // }
                // }
            // }
        // };
        // if (onboard && checkIsReady()) {
            // waitForDefaultProvider();
        // }
        // return () => {
            // mounted = false;
        // };
    // }, [onboard]);

    // useEffect(() => {
        // if (onboard) {
            // onboard?.config({ darkMode: isDark });
        // }
    // }, [isDark]);

    useEffect(() => {
        const signer = provider?.getSigner();
        setSigner(signer);
    }, [provider, account]);

    useMemo(() => {
        let mounted = true;
        if (provider) {
            provider.getBlockNumber().then((num) => {
                console.debug(`Setting block number: ${num}`);
                if (mounted) {
                    setBlockNumber(num);
                }
            });
            provider.getGasPrice().then((gasPrice) => {
                console.debug(`Setting gas price: ${gasPrice.toNumber()}`);
                if (mounted) {
                    setGasPrice(parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei')));
                }
            });
        }
        return () => {
            mounted = false;
        };
    }, [provider, network]);

    const checkIsReady = async () => {
        const isReady = await onboard?.walletCheck().catch((_err) => false);
        console.debug('Wallet is ready', isReady);
        setIsReady(!!isReady);
        return !!isReady;
    };

    const resetOnboard = async () => {
        window.localStorage.setItem('onboard.selectedWallet', '');
        setIsReady(false);
        await onboard?.walletReset();
    };

    const handleConnect = async () => {
        if (onboard) {
            try {
                const selectedWallet = await onboard?.walletSelect();
                if (selectedWallet) {
                    await checkIsReady();
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const web3Context = React.useMemo(
        () => ({
            account: account,
            signer: signer,
            network: network,
            provider: provider,
            wallet: wallet,
            gasPrice,
            blockNumber,
            unsupportedNetworkPopupRef,
        }),
        [provider, signer, gasPrice, account, network, wallet, blockNumber],
    );

    const onboardState = onboard?.getState();
    return (
        <>
            <OnboardContext.Provider
                value={{
                    onboard: onboard,
                    isReady: isReady,
                    checkIsReady,
                    isMobile: !!onboardState?.mobileDevice,
                    resetOnboard,
                    handleConnect,
                }}
            >
                <Web3Context.Provider value={web3Context}>{children}</Web3Context.Provider>
            </OnboardContext.Provider>
        </>
    );
};

const useWeb3: () => Web3Context = () => {
    const context = React.useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a OnboardProvider');
    }
    return context;
};

export const useWeb3Actions: () => OnboardContext = () => {
    const context = React.useContext(OnboardContext);
    if (context === undefined) {
        throw new Error('useWeb3Actions must be used within a OnboardProvider');
    }
    return context;
};

export { Web3Store, useWeb3 };
