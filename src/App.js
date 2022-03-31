import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import './styles/main.scss'
import logo from "./assets/logo.png"

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Click buy to mint your NFT.`);
  const [mintAmount, setMintAmount] = useState(1);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
    PAUSED: true,
    WHITELIST: []
  });

  const claimNFTs = () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, the ${CONFIG.NFT_NAME} is yours! Go visit Opensea.io to view it.`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) { newMintAmount = 1; }
    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 10) { newMintAmount = 10; }
    setMintAmount(newMintAmount);
  };

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <>
      <main>
        <div className="full">
          <div className="header">
            <img src={logo} alt="logo" id="logo"></img>
            <div className="main-site">
              <a href="https://pablopieces.com" target="_blank" rel="noreferrer noopener">Back to main site</a>
            </div>
          </div>
          <div className="content">
            <div className="supply">
              {data.totalSupply} / {CONFIG.MAX_SUPPLY}
            </div>
            <div className="address">
              <a target={"_blank"} href={CONFIG.SCAN_LINK}>
                {truncate(CONFIG.CONTRACT_ADDRESS, 15)}
              </a>
            </div>
            {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
              <>
                <h1>The sale has ended.</h1>
                <div>
                  You can still find {CONFIG.NFT_NAME} on
                </div>
                <a target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                  {CONFIG.MARKETPLACE}
                </a>
              </>
            ) : (
              <>
                <h1>
                  1 {CONFIG.SYMBOL} costs {CONFIG.DISPLAY_COST}{" "}
                  {CONFIG.NETWORK.SYMBOL}.
                </h1>
                <p>Excluding gas fees. </p>
                {(CONFIG.PAUSED === true) ? (
                  <>
                    <h1>Mint is not active</h1>
                  </>
                ) : (
                  <>
                    {blockchain.account === "" || blockchain.smartContract === null ? (
                      <div className="connect">
                        <p>Connect to the {CONFIG.NETWORK.NAME} network</p>
                        <button className="connect-button" onClick={(e) => {
                          e.preventDefault();
                          dispatch(connect());
                          getData();
                        }}>
                          Connect
                        </button>
                        {blockchain.errorMsg !== "" ? (
                          <>
                            <p>
                              {blockchain.errorMsg}
                            </p>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <>                  
                        {/* IMPORTANT: make sure config whitelists are all lowercase as .includes() is case sensitive  */}
                        {(CONFIG.WHITELIST.length === 0 || CONFIG.WHITELIST.includes(blockchain.account.toLowerCase())) ? (
                          <>
                            <p>{feedback} </p>
                            <div className="increment">
                              <button className="increment-button"
                                style={{ lineHeight: 0.4 }}
                                disabled={claimingNft ? 1 : 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  decrementMintAmount();
                                }}>
                                -
                              </button>
                              <p id="center">{mintAmount} </p>
                              <button className="increment-button"
                                disabled={claimingNft ? 1 : 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  incrementMintAmount();
                                }}>
                                +
                              </button>
                            </div>
                            <div>
                              <button
                                disabled={claimingNft ? 1 : 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  claimNFTs();
                                  getData();
                                }}>
                                {claimingNft ? "BUSY" : "BUY"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <h1>Sorry, you're not on the whitelist :( Come back for the Public Sale on April 1st!</h1>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <div className="info">
            <p>
              Please make sure you are connected to the right network (
              {CONFIG.NETWORK.NAME} Mainnet) and the correct address. Please note:
              Once you make the purchase, you cannot undo this action.
            </p>
            <p>
              We have set the gas limit to {CONFIG.GAS_LIMIT} for the contract to
              successfully mint your NFT. We recommend that you don't lower the
              gas limit.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;