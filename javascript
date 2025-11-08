// =============================================================================
// 🚀 CONFIGURACIÓN MEJORADA PARA PRODUCCIÓN
// =============================================================================

// PRECIO ACTUALIZADO DEL ASV-A (Basado en datos reales)
const ASV_A_PRICE_USD = 0.006917; // Precio actualizado desde CMC

// CONTRATOS REALES EN BNB CHAIN
const CONTRACT_CONFIG = {
    ASV_A_TOKEN: {
        address: '0x2682FA44105a60F2016FAa8909eA82d3d427bfFc',
        abi: [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function transfer(address to, uint amount) returns (bool)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function name() view returns (string)",
            "function symbol() view returns (string)"
        ]
    },
    TREASURY: '0x4989e248039E69A7115842d0571C4003E9991234',
    BNB_CHAIN_ID: 56,
    RPC_URLS: [
        'https://bsc-dataseed.binance.org/',
        'https://bsc-dataseed1.defibit.io/',
        'https://bsc-dataseed1.ninicoin.io/'
    ]
};

// =============================================================================
// 🌐 PROVEEDOR DE FALLBACK MEJORADO
// =============================================================================

async function getBestProvider() {
    for (const rpcUrl of CONTRACT_CONFIG.RPC_URLS) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            await provider.getNetwork();
            console.log(`✅ Conectado a RPC: ${rpcUrl}`);
            return provider;
        } catch (error) {
            console.warn(`❌ Falló RPC: ${rpcUrl}`, error);
            continue;
        }
    }
    throw new Error('No se pudo conectar a ningún proveedor BNB Chain');
}

// =============================================================================
// 🔍 VERIFICACIÓN MEJORADA DE CONTRATO
// =============================================================================

async function verifyTokenContract() {
    try {
        const name = await asvTokenContract.name();
        const symbol = await asvTokenContract.symbol();
        const decimals = await asvTokenContract.decimals();
        
        logCosmicEvent(`✅ CONTRATO VERIFICADO: ${name} (${symbol}) - Decimals: ${decimals}`);
        return true;
    } catch (error) {
        logCosmicEvent(`❌ ERROR: Contrato ASV-A no responde. Verifica la dirección.`);
        return false;
    }
}

// =============================================================================
// 💰 CÁLCULO DE GAS Y LÍMITES MEJORADOS
// =============================================================================

async function estimateTransactionCost(transaction) {
    try {
        const gasEstimate = await signer.estimateGas(transaction);
        const gasPrice = await provider.getGasPrice();
        const gasCost = gasEstimate.mul(gasPrice);
        const gasCostBNB = ethers.utils.formatEther(gasCost);
        
        logCosmicEvent(`⛽ Gas estimado: ${gasEstimate.toString()} | Costo: ${gasCostBNB} BNB`);
        return { gasEstimate, gasPrice };
    } catch (error) {
        logCosmicEvent(`⚠️ No se pudo estimar gas: ${error.message}`);
        return null;
    }
}

// =============================================================================
// 🎯 FLUJO DE TRANSACCIÓN MEJORADO (2-STEP)
// =============================================================================

async function executeTwoStepTransaction(step1Function, step2Function, params) {
    if (!deusState.wallet_connected) {
        showServiceResult('error', 'Wallet Desconectada', 'Conecta tu wallet primero');
        return false;
    }

    try {
        // Paso 1: Aprobación
        logCosmicEvent(`🔄 INICIANDO FLUJO DE 2 PASOS...`);
        
        const approvalResult = await step1Function(params);
        if (!approvalResult) {
            throw new Error('Fallo en aprobación');
        }

        // Paso 2: Ejecución principal
        const mainResult = await step2Function(params);
        if (!mainResult) {
            throw new Error('Fallo en ejecución principal');
        }

        logCosmicEvent(`✅ FLUJO COMPLETADO EXITOSAMENTE`);
        return true;

    } catch (error) {
        handleTransactionError(error, "FLUJO 2-STEP");
        return false;
    }
}

// =============================================================================
// 📈 MONITOREO DE SALDO EN TIEMPO REAL
// =============================================================================

function startBalanceMonitor() {
    // Actualizar saldo cada 30 segundos
    setInterval(async () => {
        if (deusState.wallet_connected) {
            await updateASVBalance();
        }
    }, 30000);

    // Escuchar eventos de transferencia
    if (asvTokenContract && deusState.wallet_address) {
        asvTokenContract.on('Transfer', (from, to, value) => {
            if (from.toLowerCase() === deusState.wallet_address.toLowerCase() || 
                to.toLowerCase() === deusState.wallet_address.toLowerCase()) {
                
                logCosmicEvent(`🔄 EVENTO DE TRANSFERENCIA DETECTADO - Actualizando saldo...`);
                setTimeout(updateASVBalance, 2000); // Pequeño delay para que la blockchain se actualice
            }
        });
    }
}

// =============================================================================
// 🔐 GESTIÓN MEJORADA DE WALLET
// =============================================================================

async function connectWallet(initial = false) {
    if (!isMetaMaskAvailable()) return;

    try {
        document.getElementById('walletStatus').textContent = 'CONECTANDO...';
        document.getElementById('walletStatus').style.color = '#ffb84d';
        
        // Solicitar conexión
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        deusState.wallet_address = accounts[0];

        // Usar proveedor de fallback si MetaMask no está disponible
        if (!window.ethereum) {
            provider = await getBestProvider();
            signer = provider.getSigner();
        } else {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
        }

        // Verificar red
        const network = await provider.getNetwork();
        if (network.chainId !== CONTRACT_CONFIG.BNB_CHAIN_ID) {
            await switchToBNBChain();
        }

        // Inicializar contrato
        asvTokenContract = new ethers.Contract(
            CONTRACT_CONFIG.ASV_A_TOKEN.address, 
            CONTRACT_CONFIG.ASV_A_TOKEN.abi, 
            signer
        );

        // Verificar contrato
        const contractValid = await verifyTokenContract();
        if (!contractValid) {
            throw new Error('Contrato ASV-A no válido');
        }

        deusState.wallet_connected = true;
        await updateASVBalance();
        
        // Actualizar UI
        updateWalletUI(true);
        
        if (!initial) {
            logCosmicEvent(`✅ WALLET CONECTADA: ${shortenAddress(deusState.wallet_address)}`);
        }

        // Iniciar monitoreo
        startBalanceMonitor();

    } catch (error) {
        console.error('Error en conexión:', error);
        handleConnectionError(error);
    }
}

// =============================================================================
// 🔄 FUNCIÓN PARA CAMBIAR A BNB CHAIN
// =============================================================================

async function switchToBNBChain() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], // 56 en hexadecimal
        });
        return true;
    } catch (switchError) {
        // Si la red no está agregada, agregarla
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x38',
                        chainName: 'BNB Smart Chain',
                        nativeCurrency: {
                            name: 'BNB',
                            symbol: 'BNB',
                            decimals: 18
                        },
                        rpcUrls: CONTRACT_CONFIG.RPC_URLS,
                        blockExplorerUrls: ['https://bscscan.com/']
                    }]
                });
                return true;
            } catch (addError) {
                throw new Error('Usuario rechazó agregar BNB Chain');
            }
        }
        throw new Error('Usuario rechazó cambiar a BNB Chain');
    }
}

// =============================================================================
// 🎭 ACTUALIZACIÓN MEJORADA DE UI
// =============================================================================

function updateWalletUI(connected) {
    if (connected) {
        document.getElementById('walletStatus').textContent = 'CONECTADA (BNB Chain)';
        document.getElementById('walletStatus').style.color = '#00ffaa';
        document.getElementById('connectedAddress').textContent = shortenAddress(deusState.wallet_address);
        document.getElementById('connectButton').style.display = 'none';
        document.getElementById('disconnectButton').style.display = 'block';
    } else {
        document.getElementById('walletStatus').textContent = 'DESCONECTADA';
        document.getElementById('walletStatus').style.color = '#ff8c00';
        document.getElementById('connectedAddress').textContent = '--';
        document.getElementById('connectButton').style.display = 'block';
        document.getElementById('disconnectButton').style.display = 'none';
        document.getElementById('asv_balance').textContent = '0 ASV-A';
    }
}

// =============================================================================
// 🚨 MANEJO MEJORADO DE ERRORES
// =============================================================================

function handleConnectionError(error) {
    let message = 'Error desconocido al conectar';
    
    if (error.code === 4001) {
        message = 'Usuario rechazó la conexión';
    } else if (error.code === -32002) {
        message = 'Ya hay una solicitud de conexión pendiente';
    } else if (error.message.includes('Network')) {
        message = 'Error de red - Verifica tu conexión';
    }
    
    logCosmicEvent(`❌ ERROR DE CONEXIÓN: ${message}`);
    showServiceResult('error', 'Conexión Fallida', message);
    updateWalletUI(false);
}

// =============================================================================
// 📊 FUNCIONES DE UTILIDAD MEJORADAS
// =============================================================================

function formatASVBalance(balance) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(balance);
}

function calculateUSDValue(asvAmount) {
    return (asvAmount * ASV_A_PRICE_USD).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });
}

// =============================================================================
// 🎪 INICIALIZACIÓN MEJORADA
// =============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 INICIANDO ASV-A dApp - MODO PRODUCCIÓN REAL');
    
    // Inicializar interfaz
    initializeUI();
    
    // Verificar conexión automática
    await checkAutoConnect();
    
    // Configurar event listeners
    setupEventListeners();
    
    logCosmicEvent('🌐 dApp ASV-A inicializada - Lista para operaciones reales en BNB Chain');
});

async function checkAutoConnect() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            logCosmicEvent('🔑 Wallet previamente conectada - Reconectando...');
            await connectWallet(true);
        }
    }
}

function setupEventListeners() {
    // Listeners de MetaMask
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                logCosmicEvent('🔐 Wallet desconectada por usuario');
                disconnectWallet();
            } else {
                logCosmicEvent('🔄 Cambio de cuenta detectado');
                connectWallet();
            }
        });
        
        window.ethereum.on('chainChanged', (chainId) => {
            logCosmicEvent(`⛓️ Cambio de red: ${parseInt(chainId)}`);
            setTimeout(() => connectWallet(), 1000);
        });
    }
}
