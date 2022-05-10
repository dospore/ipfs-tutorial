import Head from "next/head";
import Link from "next/link";
import Account from "@components/Account";
// import ETHBalance from "@components/ETHBalance";
// import TokenBalance from "@components/TokenBalance";
import Network from "@components/Network";

import styled from 'styled-components';
import {useWeb3} from "context/Web3Context";

// const DAI_TOKEN_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";

const Nav = styled.nav`
    display: flex;
    justify-content: space-between;
`

const Main = styled.main`
  text-align: center;

`

function Home() {
  const { account } = useWeb3();

  const isConnected = typeof account === "string";

  return (
    <div>
      <Head>
        <title>next-web3-boilerplate</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <Nav>
          <Link href="/">
            <a>next-web3-boilerplate</a>
          </Link>

          <Account />
        </Nav>
      </header>

      <Main>
        <h1>
          Welcome to{" "}
          <a href="https://github.com/mirshko/next-web3-boilerplate">
            next-web3-boilerplate
          </a>
        </h1>

        {isConnected && (
          <section>
            <Network />
          </section>
        )}
      </Main>
    </div>
  );
}

export default Home;
