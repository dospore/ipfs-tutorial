

export enum NETWORK {
  UNKNOWN = -1,
  MAINNET = 1,
  KOVAN = 4,
}

export const networkNames:Record<NETWORK, string> = {
  [NETWORK.UNKNOWN]: 'Unknown',
  [NETWORK.MAINNET]: 'Mainnet',
  [NETWORK.KOVAN]: 'Kovan',
}
