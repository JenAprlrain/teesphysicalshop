import React, { useState, useEffect, useRef, } from 'react';
import ReactDOM from 'react-dom';
import Web3 from 'web3';
import ABI from './ABI.json';
import TeeShopABI from './TeeShopABI.json';
import './App.css';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import metamaskfox from './images/MetaMask_Fox.png';
import ConkPunkTee from './images/ConkPunkTee.png';
import sizechart from './images/sizechart.png';
import logo from './images/logo.png';
import emailjs from "emailjs-com";
import { countryOptions } from './countries';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function MyComponent() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [hasPurchasedTee, setHasPurchasedTee] = useState(false);
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [country, setCountry] = useState('');
  const [OwnedNFTs, setOwnedNFTs] = useState([]);
  const [ImageURLs, setImageURLs] = useState([]);
  const [Names, setNames] = useState([]);
  const [Contract, setContract] = useState(null);
  const [haveMetamask, setHaveMetamask] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [showBalance, setShowBalance] = useState(false);
  const [price, setPrice] = useState("");
  const [internationalPrice, setInternationalPrice] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [orderIds, setOrderIds] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [fetchedOrderIds, setFetchedOrderIds] = useState(false);
  const [orderStatusNotFound, setOrderStatusNotFound] = useState(false);

  useEffect(() => {
    if (Contract) {
      fetchOwnedNFTs();
    }
  }, [Contract]);

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Prompt user to connect their wallet
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Get the user's account address
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        const walletaddress = accounts[0];
        setAccount(walletaddress);

        // Get the user's account balance
        const balanceInWei = await web3.eth.getBalance(walletaddress);
        const balanceInEth = web3.utils.fromWei(balanceInWei, 'ether');
        setBalance(balanceInEth);

        // Check if the wallet has NFTs
        const ContractAddress = '0x3d8B6254ACd2c7AEc285b251c78A793B80A18772';
        const Contract = new web3.eth.Contract(ABI, ContractAddress);
        const numTokens = await Contract.methods.balanceOf(walletaddress).call();
        setHasNFT(numTokens > 0);
        setContract(Contract);

        setIsConnected(true);
        

         // Scroll the screen to the center
         setTimeout(() => {
          window.scrollTo(0, 0.50 * window.innerHeight);
        }, 500);

      } catch (error) {
        console.error(error);
        setIsConnected(false);
      }
    } else {
      console.error('Please install MetaMask to use this app');
      setIsConnected(false);
      setHaveMetamask(false);
    }
  };

  async function fetchOwnedNFTs() {
    console.log("fetchOwnedNFTs function is called");
    try {
      if (!window.ethereum) {
        setHaveMetamask(false);
      }
  
      console.log('Contract:', Contract);
  
      if (!Contract) {
        console.log('contract is not available yet');
        return;
      }
  
      let tokenId;
      let balanceOf;
  
      // Retrieve the balance of the NFTs from contract
      balanceOf = await Contract.methods.balanceOf(account).call();
      console.log('balance of:', balanceOf);
  
      // Get the owned NFTs for the contract
      const OwnedNFTs = [];
  
      for (let index = 0; index < balanceOf; index++) {
        try {
          tokenId = await Contract.methods.tokenOfOwnerByIndex(account, index).call();
          console.log(tokenId.toString());
          OwnedNFTs.push(tokenId.toString());
        } catch (error) {
          console.error(error);
          break;
        }
      }
  
      setOwnedNFTs(OwnedNFTs.map(ownedNFT => ownedNFT.toString()));

} catch (error) {
  // Handle any other errors
}
}
 
useEffect(() => {
  if (OwnedNFTs.length > 0) {
    fetchImageURLs();
  }
}, [OwnedNFTs]);

  async function fetchImageURLs() {
    console.log("fetchImageURLs function is called");
    try {
      if (!window.ethereum) {
        setHaveMetamask(false);
      }
  
      const ImageURLs = [];
      const Names = [];
      for (const tokenId of OwnedNFTs) {
        console.log ('tokenID:',tokenId)
        console.log ('contract2:',Contract)
        const tokenURI = await Contract.methods.tokenURI(tokenId).call();
        console.log ('token URI:',tokenURI)
        const viewableURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
        const response = await fetch(viewableURI);
        const tokenData = await response.json();
        console.log('tokenData:', tokenData);
        const viewableImageURI = tokenData.image.replace("ipfs://", "https://ipfs.io/ipfs/");
        ImageURLs.push(viewableImageURI);
        Names.push(tokenData.name);
      }
      setImageURLs(ImageURLs);
      setNames(Names);

    } catch (error) {
      // Handle any errors
    }
  }

  const web3 = new Web3(window.ethereum);
  const teeshopAddress = '0x550Ca3EEe22d484495488823d65F3c51ab23C634';
  const teeshopContract = new web3.eth.Contract(TeeShopABI, teeshopAddress);
  const collection = "ConkPunks";

  let priceInEth = null;
  let InternationalPriceInEth = null;

  async function fetchPrice(walletAddress) {
    try {
      const priceInWei = await teeshopContract.methods.getPrice().call();
      const priceInEth = web3.utils.fromWei(priceInWei, 'ether');
      setPrice(priceInEth);
      console.log ('price:',priceInEth)
  
      const InternationalpriceInWei = await teeshopContract.methods.getInternationalPrice().call();
      const InternationalPriceInEth = web3.utils.fromWei(InternationalpriceInWei, 'ether');
      setInternationalPrice(InternationalPriceInEth);
      console.log ('International price:',InternationalPriceInEth)
  
    } catch (error) {
      // Handle any errors
    }
  }
  
  
  useEffect(() => {
    fetchPrice();
  }, []);
  
  const handleFetchOrderIds = async () => {
    try {
      const orderIds = await teeshopContract.methods.getOrdersByBuyer(walletAddress).call();
      console.log('order IDs:', orderIds);
      setOrderIds(orderIds);
      setFetchedOrderIds(true);
  
      orderIds.forEach(async (orderId) => {
        await handleFetchOrderStatus(orderId);
      });
    } catch (error) {
      console.error(error);
    }
  };
  

  const handleFetchOrderStatus = async () => {
    try {
      const order = await teeshopContract.methods.getOrder(orderId).call();
      if (parseInt(order.orderTime) === 0) {
        setOrderStatusNotFound(true);
      } else {
        setOrderStatus(order);
        setOrderStatusNotFound(false);
      }
      setOrderData(order);
    } catch (error) {
      console.error(error);
      setOrderStatusNotFound(true);
    }
  };
  
  
  
  const handleResetWalletAddress = () => {
    setWalletAddress("");
    setOrderIds([]);
    setFetchedOrderIds(false);
  };

  const handleResetOrderId = () => {
    setOrderId("");
    setOrderStatus(null);
    setOrderStatusNotFound(false);
  };

  const handleShowSizingChart = () => {
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    const image = document.createElement("img");
    image.src = sizechart;
    lightbox.appendChild(image);
    document.body.appendChild(lightbox);
  };

  document.body.addEventListener("click", (event) => {
    if (event.target.classList.contains("lightbox")) {
      event.target.remove();
    }
  });
  
  const sendForm = async (formData, TransactionId) => {
    // add the transactionId to the form data
    formData.append('TransactionId', TransactionId);
    formData.append('collection', collection);

    // send the form data using Sheet.Best
    fetch('https://sheet.best/api/sheets/5d85a1e2-7706-4336-b828-f89b2cfd1634', {
      method: 'POST',
      mode: "cors",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
    // send the form data using EmailJS
    emailjs.send('service_6sbydyq', 'template_my0u9up', Object.fromEntries(formData.entries()), 'QBqLKhni2xQLeZM43');
    emailjs.send('service_6sbydyq', 'template_a1mgjo8', Object.fromEntries(formData.entries()), 'QBqLKhni2xQLeZM43')
      .then((result) => {
        console.log("Email sent successfully:", result.text);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      })
      .finally(() => {
        // reset form values after submission
        setFirstName('');
        setLastName('');
        setEmail('');
        setAddress('');
        setAddress2('');
        setCity('');
        setState('');
        setZipcode('');
        setCountry('');
        setShirtSize('');
        setFormSubmitted(true);
        setHasPurchasedTee(true);
        if (form.current) {
          form.current.reset();
          console.log('Form data after reset:', new FormData(form.current));
        }
      });
  };
  
  const purchaseTee = async (event) => {
    event.preventDefault(); // prevent the form from being submitted
    
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const walletaddress = accounts[0];
  
      const formData = new FormData(form.current);
      const country = formData.get('country');
      console.log('Country:', country);
  
      // Buy the tee and get the transaction hash
      let result, TransactionId;
      if (country === 'US') {
        result = await teeshopContract.methods.buyTee().send({ from: walletaddress, value: web3.utils.toWei("1", "ether") });
      } else {
        result = await teeshopContract.methods.buyTeeI().send({ from: walletaddress, value: web3.utils.toWei("2", "ether") });
      }
      TransactionId = result.transactionHash;
      console.log('Transaction Hash:', TransactionId);
  
      // Wait for the transaction to complete
      const receipt = await web3.eth.getTransactionReceipt(result.transactionHash);
      console.log('Transaction receipt:', receipt);

      // Wait for a few seconds before retrieving the latest order ID
      await new Promise(resolve => setTimeout(resolve, 10000));
  
      // Get the latest order ID for the buyer
      const orderIds = await teeshopContract.methods.getOrdersByBuyer(walletaddress).call();
      const latestOrderId = orderIds[orderIds.length - 1];
      console.log('Latest order ID:', latestOrderId);


      // Get the order data using the latest order ID
      const order = await teeshopContract.methods.getOrder(latestOrderId).call();
      const { orderId, buyer, orderTime, fulfilled } = order;
      console.log('latest order info:', order);

      // Format the orderTime string
      const formattedOrderTime = new Date(orderTime * 1000).toLocaleString('en-US', {
       year: 'numeric',
       month: 'short',
       day: 'numeric',
       hour: 'numeric',
       minute: 'numeric',
       second: 'numeric',
       hour12: true,
       timeZoneName: 'short'
      });

      // Add the order data and transaction ID to the form data
      formData.append('orderId', orderId);
      formData.append('buyer', buyer);
      formData.append('orderTime', formattedOrderTime);
      formData.append('fulfilled', fulfilled);
      formData.append('TransactionId', TransactionId);
      formData.append('collection', collection);
  
      // Send the form data
      await sendForm(formData, TransactionId);
  
      // Reset form values after submission
      setFirstName('');
      setLastName('');
      setEmail('');
      setAddress('');
      setAddress2('');
      setCity('');
      setState('');
      setZipcode('');
      setCountry('');
      setShirtSize('');
      setFormSubmitted(true);
      setHasPurchasedTee(true);
      if (form.current) {
        form.current.reset();
        console.log('Form data after reset:', new FormData(form.current));
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  
    const form = useRef(); // create a reference to the form element

    function handleReset() {
      window.location.reload();
    }

      function handleWebsiteClick() {
        window.location.href = 'https://www.officialnftees.com';
      }
    
  return (
    <div className="container">
      <img src={logo} alt="Conk Punk Tee" style={{ display: "block", margin: "auto" }} />
      <img src={ConkPunkTee} alt="Conk Punk Tee" style={{ display: "block", margin: "auto" }} />

      <div className="connect-wallet">
  <button className="connect-button" onClick={connectWallet}>
    {isConnected ? 'WALLET CONNECTED' : 'CONNECT WALLET'}
  </button>
</div>
    {!haveMetamask && (
      <div className="no-metamask">
        <img src={metamaskfox} alt="Please install MetaMask" />
        <h2 className="no-metamask-text">Please install MetaMask to use this app.</h2>
      </div>
      
    )}
      {isConnected && (
        <div className="wallet-info">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Wallet Connected</h5>
              <p className="card-text">{account.substr(0, 6)}...{account.substr(-4)}</p>
              <p className="card-text">
            {showBalance ? balance : '****'}
            {' FTM (Wallet Balance)'}
            {showBalance ? (
              <FaEyeSlash onClick={toggleBalanceVisibility} />
            ) : (
              <FaEye onClick={toggleBalanceVisibility} />
            )}
          </p>
            </div>
          </div>
          {hasNFT && formSubmitted &&(
        <div className="popup-wrapper">
        <div className="overlay"></div>
        <div className="popup">
          <p>You have successfully purchased a TEE!</p>
          <p>You will be recieving an email with your order details</p>
          <button className="reroute-button" onClick={handleReset}>ORDER ANOTHER TEE</button>
          <button className="reroute-button" onClick={handleWebsiteClick}>VISIT OUR WEBSITE</button>
        </div>
      </div>
      )}
          {hasNFT && !hasPurchasedTee && (
        <div>
          <h2 className="owned-nfts-text">Congrats, you're holding at least 1 conk punk in your wallet, you can purchase a conk punk physical tee!</h2>
          <div className="nft-list">
          </div>
          <div className="wallet-info">
          <div className="card">
          <div className="card-body">
          <p className="infocard-text">United States Price: {price} FTM</p>
          <p className="infocard-text">International Price: {internationalPrice} FTM</p>
          <p className="infocard-text">Prices include shipping and handling</p>
          </div>
          </div>
          </div>
        </div>
      )}
      {!hasNFT && (
        <div className="no-nfts">
          <h2 className="no-nfts-text">You do not own any Conk Punks NFTs, please buy from Secondary Market to gain access to buying a Conk Punks TEE.  </h2>
          <a href="https://nftkey.app/collections/conkpunks/" target="_blank" rel="noreferrer">https://nftkey.app/collections/conkpunks/</a>
        </div>
      )}
      <br></br>
      <br></br>
      {hasNFT && !hasPurchasedTee && (
        <div className="purchase-tee">
           <button className="purchase-button" id="View sizing-chart" onClick={handleShowSizingChart}>View Sizing Chart</button>
           <br></br>
           <br></br>
           <br></br>
           <br></br>
        <form ref={form} onSubmit={purchaseTee}>
      <div className="form-container">
  <div className="form-group">
    <label htmlFor="name">First Name:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="firstname" onChange={(event) => setFirstName(event.target.value)} required />
  </div>
  <div className="form-group">
    <label htmlFor="name">Last Name:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="lastname" onChange={(event) => setLastName(event.target.value)} required />
  </div>
  <div className="form-group">
    <label htmlFor="email">Email Address:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="email" onChange={(event) => setEmail(event.target.value)} required />
  </div>
  <div className="form-group">
    <label htmlFor="address">Address:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="address" onChange={(event) => setAddress(event.target.value)} required />
  </div>
  <div className="form-group">
    <label htmlFor="address2">Address Line 2 (optional):&nbsp;</label>
    <input type="text" name="address2" onChange={(event) => setAddress2(event.target.value)} />
  </div>
  <div className="form-group">
    <label htmlFor="city">City:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="city" onChange={(event) => setCity(event.target.value)} required />
  </div>
  <div className="form-group">
    <label htmlFor="state/region">State/Region:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="state" onChange={(event) => setState(event.target.value)} required />
  </div>
  <div className="form-group">
    <label htmlFor="zipcode">Zip Code/ Postal Code:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="zipcode" onChange={(event) => setZipcode(event.target.value)} required />
  </div>
  <div className="form-group">
  <label htmlFor="country">Country:&nbsp;<span className="required">*&nbsp;</span></label>
  <select name="country" onChange={(event) => setCountry(event.target.value)} required style={{ fontSize: '20px' }} defaultValue="United States">
  <option value="">Select country</option>
  {countryOptions.map((country) => (
    <option key={country.value} value={country.value}>
      {country.label}
    </option>
  ))}
</select>
</div>
  <div className="form-group">
    <label htmlFor="shirtSize">Shirt Size:<span className="required">*&nbsp;</span></label>
    <select name="shirtSize" onChange={(event) => setShirtSize(event.target.value)} required style={{ fontSize: '20px' }}>
      <option value="">Select size</option>
      <option value="S">Small</option>
      <option value="M">Medium</option>
      <option value="L">Large</option>
      <option value="XL">XL</option>
      <option value="XXL">2XL</option>
    </select>
  </div>
</div>
 <br></br>
  <br></br>
          <button className="purchase-button" type="submit">
            PURCHASE TEE
          </button>
          </form>
        </div>
      )}
    </div>
  )}
  <br></br>
  <br></br>
  {haveMetamask && (
  <div className="ordercard">
      <div className="ordercard-body">
              <h5 className="ordercard-title">Check Order Status</h5>
      <div>
        <label>
          Wallet Address:&nbsp;
          <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
        </label>
        <button onClick={handleFetchOrderIds}>Fetch Order IDs</button>
        <button onClick={handleResetWalletAddress}>Reset</button>
        {fetchedOrderIds && orderIds.length === 0 && (
  <div>
    <p className="card-text">No orders have been received from this address.</p>
  </div>
  
)}

{fetchedOrderIds && orderIds.length > 0 && (
  <div>
    <p className="card-text">Order IDs: {orderIds.join(", ")}</p>
  </div>
)}
<div style={{ marginTop: "20px" }}>
  <label>
    Order ID:&nbsp;
    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
  </label>
  <button onClick={handleFetchOrderStatus}>Check Order Status</button>
  <button onClick={handleResetOrderId}>Reset</button>
  </div>
  {orderStatusNotFound && (
  <div>
    <p className="card-text">No orders have been found with the order ID.</p>
  </div>
)}
  {orderStatus && (
    <div>
      <p className="card-text">Purchase was received for order ID {orderId}:</p>
      <p className="card-text">Order time: {new Date(orderStatus.orderTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZoneName: 'short'
      })}</p>
      <p className="card-text">Fulfilled: {orderStatus.fulfilled ? "Yes, Check email for tracking number" : "No, still processing order"}</p>
    </div>
  )}
</div>
      </div>
      </div>
  )}
</div>

);
}

export default MyComponent;