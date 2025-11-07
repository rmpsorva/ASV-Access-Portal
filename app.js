// ASV Token Gate — BNB Mainnet
const CFG = {
  "chainId": 56,
  "chainName": "BNB Smart Chain",
  "rpcUrls": [
    "https://bsc-dataseed1.bnbchain.org",
    "https://bsc-dataseed.binance.org"
  ],
  "blockExplorer": "https://bscscan.com",
  "tokenAddress": "0x2682FA44105a60F2016FAa8909eA82d3d427bfFc",
  "requiredBalance": "1000",
  "downloadGate": "protected/demo.txt"
};
const ERC20_ABI = [{"constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function", "stateMutability": "view"}, {"constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function", "stateMutability": "view"}, {"constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function", "stateMutability": "view"}];

const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);
const byId = (id)=>document.getElementById(id);

async function switchToBnb() {
  if (!window.ethereum) throw new Error("No wallet inyectada. Abre en el navegador de MetaMask/Trust.");
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: "0x" + CFG.chainId.toString(16),
      chainName: CFG.chainName,
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      rpcUrls: CFG.rpcUrls,
      blockExplorerUrls: [CFG.blockExplorer],
    }],
  });
}

let provider, signer, user;

async function connect() {
  if (!window.ethereum) {
    byId("connInfo").textContent = "No hay provider inyectado. Abre este sitio dentro del navegador de MetaMask o Trust Wallet.";
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== CFG.chainId) {
    byId("connInfo").textContent = "Red incorrecta: " + net.chainId + ". Intentando agregar / cambiar a BNB Mainnet…";
    try { await switchToBnb(); }
    catch(e){ console.warn(e); }
  }
  const accs = await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  user = accs[0];
  byId("connInfo").textContent = "Conectado: " + user.slice(0,6) + "…" + user.slice(-4);
  byId("verifyPanel").classList.remove("hidden");
}

async function checkAccess() {
  try {
    const erc20 = new ethers.Contract(CFG.tokenAddress, ERC20_ABI, provider);
    const [dec, sym] = await Promise.all([erc20.decimals(), erc20.symbol().catch(()=> 'TOKEN')]);
    byId("sym").textContent = sym;
    byId("sym2").textContent = sym;
    const min = ethers.parseUnits(CFG.requiredBalance, dec);
    const bal = await erc20.balanceOf(user);
    const human = ethers.formatUnits(bal, dec);
    byId("checkResult").textContent = `Balance: ${human} ${sym}`;
    if (bal >= min) {
      byId("gatedContent").classList.remove("hidden");
    } else {
      byId("gatedContent").classList.add("hidden");
      byId("checkResult").textContent += " • Acceso denegado: balance insuficiente.";
    }
  } catch(e) {
    console.error(e);
    byId("checkResult").textContent = "Error al verificar: " + (e?.message || e);
  }
}

function init() {
  byId("tokenAddr").textContent = CFG.tokenAddress;
  byId("reqAmount").textContent = CFG.requiredBalance;
  const link = CFG.blockExplorer + "/token/" + CFG.tokenAddress;
  byId("bscscanLink").href = link;
  byId("bscscanLink").textContent = link;
  byId("btnConnect").addEventListener("click", connect);
  byId("btnAddBnb").addEventListener("click", switchToBnb);
  byId("btnCheck").addEventListener("click", checkAccess);
}
document.addEventListener("DOMContentLoaded", init);
