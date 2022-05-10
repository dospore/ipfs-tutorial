import {Web3Store} from "context/Web3Context";
import type { AppProps } from "next/app";
import "../styles/globals.css";

function NextWeb3App({ Component, pageProps }: AppProps) {
  return (
    <Web3Store>
      <Component {...pageProps} />
    </Web3Store>
  );
}

export default NextWeb3App;
