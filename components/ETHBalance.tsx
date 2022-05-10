import {useWeb3} from "context/Web3Context";
import useETHBalance from "../hooks/useETHBalance";
import { parseBalance } from "@libs/util";

const ETHBalance = () => {
  const { account } = useWeb3();
  const { data } = useETHBalance(account);

  return <p>Balance: Ξ{parseBalance(data ?? 0)}</p>;
};

export default ETHBalance;
