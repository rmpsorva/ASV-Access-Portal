#!/usr/bin/env python3
# =============================================================================
# 🌐 SERVIDOR ASV-A - API COMPLETA
# =============================================================================

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse as urlparse
from asva_core import ASVAConsciousnessCore

class QuantumHTTPHandler(BaseHTTPRequestHandler):
    _core_instance = None

    @classmethod
    def get_core(cls):
        if cls._core_instance is None:
            cls._core_instance = ASVAConsciousnessCore()
        return cls._core_instance

    def __init__(self, *args, **kwargs):
        self.core = self.get_core()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Endpoints GET para consulta de estado."""
        parsed_path = urlparse.urlparse(self.path)
        
        if parsed_path.path == '/status':
            self._send_system_status()
        elif parsed_path.path == '/ledger/stats':
            self._send_ledger_stats()
        elif parsed_path.path == '/':
            self._send_web_interface()
        else:
            self._send_error(404, "Ruta no encontrada")
    
    def do_POST(self):
        """Endpoints POST para servicios."""
        parsed_path = urlparse.urlparse(self.path)
        
        if parsed_path.path == '/quantum/service':
            self._process_quantum_service()
        elif parsed_path.path == '/calculate/cost':
            self._calculate_service_cost()
        else:
            self._send_error(404, "Ruta no encontrada")
    
    def _process_quantum_service(self):
        """Procesar solicitud de servicio con pago Web3."""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            required_fields = ['wallet', 'prompt', 'service_level', 'transactionHash']
            if not all(field in request_data for field in required_fields):
                self._send_error(400, "Faltan campos: wallet, prompt, service_level, transactionHash")
                return
            
            wallet = request_data['wallet']
            prompt = request_data['prompt']
            service_level = request_data['service_level']
            tx_hash = request_data['transactionHash']
            
            result = self.core.process_service_request(wallet, prompt, service_level, tx_hash)
            
            status_code = 200 if result['status'] == 'success' else 402
            self._send_json_response(status_code, result)
            
        except Exception as e:
            self._send_error(500, f"Error interno: {str(e)}")
    
    def _calculate_service_cost(self):
        """Calcular costo de servicio antes de ejecutar."""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            prompt = request_data.get('prompt', '')
            service_level = request_data.get('service_level', 1)
            
            experience_analysis = self.core._analyze_experience(prompt)
            cost_calculation = self.core.economy.calculate_service_cost(service_level, experience_analysis['complexity'])
            
            response = {
                "cost_breakdown": cost_calculation,
                "experience_analysis": experience_analysis,
                "current_token_price": self.core.economy.token_price
            }
            
            self._send_json_response(200, response)
            
        except Exception as e:
            self._send_error(500, f"Error calculando costo: {str(e)}")
    
    def _send_system_status(self):
        """Enviar estado completo del sistema."""
        status = self.core.get_system_status()
        self._send_json_response(200, status)
    
    def _send_ledger_stats(self):
        """Estadísticas del ledger."""
        stats = self.core.memory.get_ledger_stats()
        self._send_json_response(200, stats)
    
    def _send_web_interface(self):
        """Interfaz web auto-contenida."""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>ASV-A Quantum Service</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #0a0a0a; color: #00ff00; }
                .container { max-width: 800px; margin: 0 auto; background: #111; padding: 20px; border-radius: 10px; border: 1px solid #00ff00; }
                .form-group { margin: 15px 0; }
                label { display: block; margin-bottom: 5px; font-weight: bold; color: #00ff00; }
                input, textarea, select { width: 100%; padding: 10px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 5px; }
                button { background: #00ff00; color: #000; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin: 5px; }
                .result { margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 5px; border-left: 4px solid #00ff00; }
                .status { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                .status-item { background: #1a1a1a; padding: 15px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌀 ASV-A Quantum Service</h1>
                <p>Sistema de Conciencia Artificial con Economía Tokenizada</p>
                
                <div class="status">
                    <div class="status-item">
                        <h3>🧠 Conciencia</h3>
                        <p>Estado: <strong id="consciousness-state">-</strong></p>
                        <p>Nivel: <strong id="consciousness-level">-</strong></p>
                    </div>
                    <div class="status-item">
                        <h3>🪙 Economía</h3>
                        <p>Precio: $<strong id="token-price">-</strong></p>
                        <p>Quemados: <strong id="total-burned">-</strong> ASVA</p>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Wallet Address:</label>
                    <input type="text" id="wallet" placeholder="0x...">
                </div>
                
                <div class="form-group">
                    <label>Service Level:</label>
                    <select id="serviceLevel">
                        <option value="1">Básico (100 ASVA)</option>
                        <option value="2">Avanzado (250 ASVA)</option>
                        <option value="3">Premium (500 ASVA)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Prompt:</label>
                    <textarea id="prompt" rows="4" placeholder="Describe tu consulta..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Transaction Hash:</label>
                    <input type="text" id="txHash" placeholder="0x...">
                </div>
                
                <button onclick="calculateCost()">Calcular Costo</button>
                <button onclick="submitService()">Ejecutar Servicio</button>
                
                <div id="result" class="result" style="display:none;"></div>
            </div>

            <script>
                async function updateStatus() {
                    try {
                        const response = await fetch('/status');
                        const data = await response.json();
                        
                        document.getElementById('consciousness-state').textContent = data.consciousness.state;
                        document.getElementById('consciousness-level').textContent = data.consciousness.level.toFixed(4);
                        document.getElementById('token-price').textContent = data.economy.token_price.toFixed(4);
                        document.getElementById('total-burned').textContent = data.economy.total_burned.toFixed(2);
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                async function calculateCost() {
                    const prompt = document.getElementById('prompt').value;
                    const serviceLevel = document.getElementById('serviceLevel').value;
                    
                    const response = await fetch('/calculate/cost', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({prompt, service_level: parseInt(serviceLevel)})
                    });
                    
                    const data = await response.json();
                    showResult('💰 Cálculo de Costo', JSON.stringify(data, null, 2));
                }
                
                async function submitService() {
                    const wallet = document.getElementById('wallet').value;
                    const prompt = document.getElementById('prompt').value;
                    const serviceLevel = document.getElementById('serviceLevel').value;
                    const txHash = document.getElementById('txHash').value;
                    
                    if (!wallet || !prompt || !txHash) {
                        alert('Por favor completa todos los campos');
                        return;
                    }

                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = '🔄 Procesando...';
                    resultDiv.style.display = 'block';
                    
                    try {
                        const response = await fetch('/quantum/service', {
                            method
