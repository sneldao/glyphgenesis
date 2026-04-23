/**
 * x402 Micropayments Module
 * Implements x402 payment protocol for API access and agent services
 * 
 * x402 is a payment protocol that uses HTTP 402 Payment Required status
 * to request micropayments for API access.
 */

import { ethers } from 'ethers';

// USDC on Monad Testnet (or use native MON for now)
const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x0000000000000000000000000000000000000000'; // Placeholder
const PAYMENT_THRESHOLD = BigInt(process.env.PAYMENT_THRESHOLD || '1000'); // $0.001 in USDC units (6 decimals)

class X402Client {
  constructor(wallet) {
    this.wallet = wallet;
    this.provider = wallet.provider;
    this.paymentHistory = [];
  }

  /**
   * Check if a response indicates payment is required
   */
  isPaymentRequired(response) {
    return response.status === 402 || 
           (response.headers && response.headers.get('X-Payment-Required'));
  }

  /**
   * Parse x402 payment requirements from response
   */
  parsePaymentRequirements(response) {
    const header = response.headers.get('X-Payment-Required');
    if (!header) return null;
    
    try {
      return JSON.parse(header);
    } catch {
      return null;
    }
  }

  /**
   * Create a payment authorization for x402
   */
  async createPaymentAuthorization(amount, recipient, expiresAt = null) {
    const nonce = Date.now();
    const expiry = expiresAt || Math.floor(Date.now() / 1000) + 3600; // 1 hour default
    
    const message = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'uint256', 'uint256'],
        [recipient, amount, nonce, expiry]
      )
    );
    
    const signature = await this.wallet.signMessage(ethers.getBytes(message));
    
    return {
      sender: this.wallet.address,
      recipient,
      amount: amount.toString(),
      nonce,
      expiry,
      signature,
      token: USDC_ADDRESS
    };
  }

  /**
   * Send a payment to a recipient
   */
  async sendPayment(recipient, amount, token = 'MON') {
    const normalizedToken = String(token || 'MON').toUpperCase();

    if (normalizedToken !== 'USDC') {
      // Send native token on the active chain (MON, tBNB, etc.)
      const tx = await this.wallet.sendTransaction({
        to: recipient,
        value: amount
      });
      
      const receipt = await tx.wait();
      
      const payment = {
        type: 'x402',
        token: normalizedToken,
        amount: ethers.formatEther(amount),
        recipient,
        txHash: tx.hash,
        timestamp: Date.now()
      };
      
      this.paymentHistory.push(payment);
      return payment;
    }

    // USDC transfer would go here when USDC is available
    throw new Error('USDC payments not yet implemented');
  }

  /**
   * Pay for an API request that requires x402 payment
   */
  async payForAPI(apiEndpoint, paymentRequirements) {
    const { amount, recipient } = paymentRequirements;
    
    // Create payment authorization
    const auth = await this.createPaymentAuthorization(
      BigInt(amount),
      recipient
    );
    
    // Send payment
    const payment = await this.sendPayment(recipient, BigInt(amount));
    
    // Retry API request with payment proof
    const response = await fetch(apiEndpoint, {
      headers: {
        'X-Payment-Authorization': JSON.stringify(auth),
        'X-Payment-TX': payment.txHash
      }
    });
    
    return { response, payment };
  }

  /**
   * Get payment history
   */
  getPaymentHistory() {
    return this.paymentHistory;
  }

  /**
   * Get total amount paid
   */
  getTotalPaid() {
    return this.paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }
}

/**
 * Middleware for servers to require x402 payments
 * (For when the agent runs its own API)
 */
class X402Server {
  constructor(options = {}) {
    this.minPayment = BigInt(options.minPayment || '1000'); // $0.001
    this.recipient = options.recipient;
    this.paymentsReceived = [];
  }

  /**
   * Middleware to require payment
   */
  requirePayment(handler) {
    return async (req, res, next) => {
      const authHeader = req.headers['x-payment-authorization'];
      const txHeader = req.headers['x-payment-tx'];
      
      if (!authHeader || !txHeader) {
        res.status(402).set({
          'X-Payment-Required': JSON.stringify({
            amount: this.minPayment.toString(),
            recipient: this.recipient,
            token: USDC_ADDRESS,
            reason: 'API access requires micropayment'
          })
        }).json({
          error: 'Payment Required',
          message: 'This API requires a micropayment'
        });
        return;
      }
      
      // Payment provided, verify it
      try {
        const auth = JSON.parse(authHeader);
        // In production, verify the payment on-chain
        this.paymentsReceived.push({
          ...auth,
          txHash: txHeader,
          timestamp: Date.now()
        });
        
        return handler(req, res, next);
      } catch (e) {
        res.status(400).json({ error: 'Invalid payment authorization' });
      }
    };
  }
}

export { X402Client, X402Server, PAYMENT_THRESHOLD };
export default X402Client;
