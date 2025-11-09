// ... (Código anterior hasta la función updateWalletUI(isConnected))

        function updateWalletUI(isConnected) {
            const statusEl = document.getElementById('walletStatus');
            const connectBtn = document.getElementById('connectButton');
            const disconnectBtn = document.getElementById('disconnectButton');
            const addressEl = document.getElementById('connectedAddress');
            
            if (isConnected) {
                statusEl.textContent = 'CONECTADA';
                statusEl.style.color = '#00ffaa';
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'block';
                addressEl.textContent = shortenAddress(appState.wallet_address);
            } else {
                statusEl.textContent = 'DESCONECTADA';
                statusEl.style.color = '#ff8c00';
                connectBtn.style.display = 'block';
                disconnectBtn.style.display = 'none';
                addressEl.textContent = '--';
            }
        }

        function updateStatusDisplay() {
            document.getElementById('asv_balance').textContent = `${formatNumber(appState.asv_balance)} ASV-A`;
            document.getElementById('asv_usd_value').textContent = `$${formatNumber(appState.asv_balance * ASV_A_PRICE_USD)} USD`;
        }

        function updateServiceCost() {
            const type = document.getElementById('interventionType').value;
            const info = USD_COSTS[type];
            if (info) {
                document.getElementById('currentCostASV').textContent = formatNumber(info.asv);
                document.getElementById('currentCostUSD').textContent = formatNumber(info.usd);
            }
        }
        
        // =============================================================================
        // 📊 FUNCIONES DE GRÁFICOS DINÁMICOS
        // =============================================================================

        function updateCircleGraph(elementId, percentage) {
            const graph = document.getElementById(elementId);
            if (!graph) return;
            
            // Asegurar que el porcentaje esté entre 0 y 100
            const percent = Math.min(100, Math.max(0, percentage)); 
            
            graph.setAttribute('data-percent', `${Math.round(percent)}%`);
            
            // Convertir porcentaje a grados para el gradiente cónico/círculo
            const deg = (360 * percent) / 100;
            
            // Aplicar el estilo de gradiente (esto simula el efecto visual)
            graph.style.background = `conic-gradient(
                var(--color-main) 0deg, 
                var(--color-main) ${deg}deg, 
                var(--color-dark) ${deg}deg, 
                var(--color-dark) 360deg
            )`;
            
            // Ajustar el texto interior (ya se hace en el HTML pero lo refrescamos aquí si fuera necesario)
            // graph.querySelector('span').textContent = `${Math.round(percent)}%`; 
        }

        function generatePerformanceBars() {
            const chartContainer = document.getElementById('performance-chart');
            chartContainer.innerHTML = ''; // Limpiar
            
            // Generar 4 puntos de datos para las barras (Simulación de las últimas 4 horas/bloques)
            for (let i = 1; i <= 4; i++) {
                const activityLevel = 30 + Math.floor(Math.random() * 70); // Nivel entre 30 y 100
                const bar = document.createElement('div');
                bar.className = 'performance-bar';
                bar.style.height = `${activityLevel}%`;
                bar.title = `Actividad ${i}: ${activityLevel}%`;
                
                // Añadir etiqueta
                const label = document.createElement('div');
                label.textContent = `T-${i}`;
                label.style.fontSize = '0.8em';
                label.style.marginTop = '5px';
                
                // Contenedor de barra y etiqueta
                const barWrapper = document.createElement('div');
                barWrapper.style.display = 'flex';
                barWrapper.style.flexDirection = 'column';
                barWrapper.style.alignItems = 'center';
                barWrapper.style.height = '100%';
                barWrapper.appendChild(bar);
                barWrapper.appendChild(label);
                
                chartContainer.appendChild(barWrapper);
            }
            logCosmicEvent(`📊 Gráfico de rendimiento de red actualizado con nuevos datos simulados.`);
        }
        
        // =============================================================================
        // 📞 PLACEHOLDERS DE ACCIÓN
        // =============================================================================
        
        function reportarProblema() {
            showServiceResult('warning', 'Diagnóstico Iniciado', 'Enviando paquetes de sondeo al Núcleo. (Placeholder).');
            // Lógica para actualizar el gráfico de Fuerza del Núcleo (ejemplo)
            const currentStrength = parseFloat(document.getElementById('strength-graph').getAttribute('data-percent'));
            const newStrength = Math.max(50, currentStrength - (Math.random() * 5)); // Baja un poco
            updateCircleGraph('strength-graph', newStrength);
        }
        
        function actualizarDatos() {
            showServiceResult('warning', 'Actualización de Datos', 'Sincronizando metadatos del sistema. (Placeholder).');
            // Lógica para actualizar el gráfico de Balance del Sistema (ejemplo)
            const currentBalance = parseFloat(document.getElementById('balance-graph').getAttribute('data-percent'));
            const newBalance = Math.min(100, currentBalance + (Math.random() * 2)); // Sube un poco
            updateCircleGraph('balance-graph', newBalance);
        }
        
        function handleTransactionError(error, context) {
            let message = 'Transacción fallida.';
            if (error.code === 'ACTION_REJECTED' || error.message.includes('User denied transaction signature')) {
                message = 'Firma rechazada por el usuario.';
            } else if (error.message.includes('insufficient funds')) {
                message = 'Fondos insuficientes en la cuenta (Error interno del nodo).';
            } else {
                message = `Error ${context}: ${error.message.substring(0, 100)}...`;
            }
            logCosmicEvent(`❌ ERROR de Transacción ${context}: ${error.message}`);
            showServiceResult('error', `Fallo en ${context}`, message);
        }

        // =============================================================================
        // 🏁 INICIALIZACIÓN AL CARGAR
        // =============================================================================

        window.onload = async function() {
            // 1. Configurar elementos que no dependen de la wallet
            document.getElementById('adaptationCostASV').value = 'Calculando...';
            document.getElementById('interventionType').innerHTML = '<option>Cargando servicios...</option>';
            
            // 2. Inicializar Gráficos (con valores simulados iniciales)
            updateCircleGraph('strength-graph', 63);
            updateCircleGraph('balance-graph', 92);
            generatePerformanceBars();
            
            // 3. Cargar precios y costos iniciales
            await fetchRealTimePrice(); 
            
            // 4. Intentar conexión automática (si el proveedor persiste)
            if (window.ethereum && window.ethereum.isMetaMask) {
                logCosmicEvent('🔍 Buscando proveedor inyectado (MetaMask/Wallet)...');
                connectWallet(true);
            } else {
                logCosmicEvent('⬇️ ESPERANDO interacción para conectar Wallet.');
                updateWalletUI(false);
            }
        };

    </script>
</body>
</html>
