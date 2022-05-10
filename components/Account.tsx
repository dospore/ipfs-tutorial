import {useWeb3, useWeb3Actions} from "context/Web3Context";
// import useENSName from "../hooks/useENSName";
import { formatEtherscanLink, shortenHex } from "@libs/util";

const Account = () => {
  const { account, network: chainId } = useWeb3()

  const { handleConnect } = useWeb3Actions();

  // const ENSName = useENSName(account);

  if (typeof account !== "string") {
    return (
      <div>
        <button
          onClick={() => handleConnect()}
        >
          {"Connect to Wallet"}
        </button>
      </div>
    );
  }

  return (
    <a
      {...{
        href: formatEtherscanLink("Account", [chainId, account]),
        target: "_blank",
        rel: "noopener noreferrer",
      }}
    >
      {`${shortenHex(account, 4)}`}
    </a>
  );
};

export default Account;
