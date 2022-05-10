import {useWeb3} from "context/Web3Context";
import {networkNames} from "libs/constants";


const Network = (() => {
  const { network } = useWeb3();

  return <p>Connected Network : {networkNames[network]}</p>;
})

export default Network;
