import React, { useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import ABI from './ABI.json';
import TeeShopABI from './TeeShopABI.json';
import './App.css';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import metamaskfox from './images/MetaMask_Fox.png';
import emailjs from "emailjs-com";
import { countryOptions } from './countries';

function MyComponent() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [hasPurchasedTee, setHasPurchasedTee] = useState(false);
  const [name, setName] = useState('');
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

  useEffect(() => {
    if (Contract) {
      fetchOwnedNFTs();
    }
  }, [Contract]);
  
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
        const ContractAddress = '0x3D4B2e54462C509b6cecA9A02C76c71a286c7e15';
        const Contract = new web3.eth.Contract(ABI, ContractAddress);
        const numTokens = await Contract.methods.balanceOf(walletaddress).call();
        setHasNFT(numTokens > 0);
        setContract(Contract);

        setIsConnected(true);

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
        const response = await fetch(tokenURI);
        const tokenData = await response.json();
        console.log('tokenData:', tokenData);
        ImageURLs.push(tokenData.image);
        Names.push(tokenData.name);
      }
      setImageURLs(ImageURLs);
      setNames(Names);

    } catch (error) {
      // Handle any errors
    }
  }

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1
  };

  const purchaseTee = async (event) => {
    event.preventDefault(); // prevent the form from being submitted

    let TransactionId = null;

    try {
      const web3 = new Web3(window.ethereum);
  
      // Get the user's account address
      const accounts = await web3.eth.getAccounts();
      const walletaddress = accounts[0];
  
      const teeshopAddress = '0x4D97b5c8C147f055651900a56ecCf2121eB80dD3';
      const teeshopContract = new web3.eth.Contract(TeeShopABI, teeshopAddress);
      const formData = new FormData(form.current);
  
      const eventPromise = new Promise((resolve, reject) => {
        teeshopContract.events.NewOrder({ fromBlock: 'latest' }, (error, event) => {
          if (error) {
            reject(error);
          }
          const { orderId, buyer, fulfilled, } = event.returnValues;
          const orderTime = new Date(event.returnValues.orderTime * 1000).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
            timeZoneName: 'short'
          });
          console.log('NewOrder event data:', { orderId, buyer, orderTime, fulfilled });
          setOrderData({ orderId, buyer, orderTime, fulfilled });
  
          // add the event data to the form data
          const formData = new FormData(form.current);
          formData.append('orderId', orderId);
          formData.append('buyer', buyer);
          formData.append('orderTime', orderTime);
          formData.append('fulfilled', fulfilled);
          formData.append('TransactionId', TransactionId)

          for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
          }
          const plainFormData = Object.fromEntries(formData.entries());
  
          // send the form data using EmailJS
          emailjs.send('service_jsb1jvd', 'template_exkkure', plainFormData , 'EdVmKYzMYfGhzMdGy')
  .then((result) => {
    console.log("Email sent successfully:", result.text);
  })
  .catch((error) => {
    console.error("Error sending email:", error);
  })
  .finally(() => {
    // reset form values after submission
    setName('');
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
  
          resolve();
        });
      });

      const country = formData.get('country');
      console.log('Country:', country);

      let result, TransactionId;
      if (country === 'US') {
        result = await teeshopContract.methods.buyTee().send({ from: walletaddress, value: web3.utils.toWei("1", "ether") });
      } else {
        result = await teeshopContract.methods.buyTeeI().send({ from: walletaddress, value: web3.utils.toWei("2", "ether") });
      }
      TransactionId = result.transactionHash;
      console.log('Transaction Hash:', TransactionId);
      
      await eventPromise;
      setHasPurchasedTee(true);
  
    } catch (error) {
      console.error(error);
    }
  };
  
  
    const form = useRef(); // create a reference to the form element
    
  return (
    <div className="container">
      <h1 className="title">Official NFTees Physical Shop</h1>
      <div className="connect-wallet">
        <button className="connect-button" onClick={connectWallet}>
          Connect Wallet
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
              <p className="card-text">{account}</p>
              <p className="card-text">{balance} FTM</p>
            </div>
          </div>
          {hasNFT && formSubmitted &&(
        <div className="popup-wrapper">
        <div className="overlay"></div>
        <div className="popup">
          <p>You have successfully purchased a TEE!</p>
        </div>
      </div>
      )}
          {hasNFT && (
        <div className="owned-nfts">
          <h2 className="owned-nfts-text">Owned NFTs:</h2>
          <div className="nft-list">
          <Slider className="my-slider" {...settings}>
            {OwnedNFTs.map((tokenId, index) => (
              <div className="nft-card" key={tokenId}>
                <img src={ImageURLs[index]} alt={Names[index]} />
                <p>{Names[index]}</p>
              </div>
            ))}
            </Slider>
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
        <form ref={form} onSubmit={purchaseTee}>
      <div className="form-container">
  <div className="form-group">
    <label htmlFor="name">Name:&nbsp;<span className="required">*&nbsp;</span></label>
    <input type="text" name="name" onChange={(event) => setName(event.target.value)} required />
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
      <option value="XL">Extra Large</option>
    </select>
  </div>
</div>
 <br></br>
  <br></br>
          <button className="purchase-button" type="submit">
            Purchase TEE
          </button>
          </form>
        </div>
      )}
    </div>
  )}
</div>
);
}
export default MyComponent;