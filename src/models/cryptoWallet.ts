export interface CryptoWallet {
  id: string;
  user_id: string;
  
  // Wallet details
  address: string;
  wallet_type: string; // 'MetaMask' | 'Coinbase Wallet' | 'Rabby' | etc
  chain_id: string; // '0x1' for Ethereum, '0x89' for Polygon, etc
  network_name: string; // 'Ethereum Mainnet', 'Base', etc
  
  // Verification
  verified: boolean;
  signature?: string; // Message signature for proof of ownership
  
  // Metadata
  is_default: boolean;
  created_at: Date;
  last_used?: Date;
  status: 'active' | 'removed';
}

export interface AddCryptoWalletRequest {
  user_id: string;
  address: string;
  wallet_type: string;
  chain_id: string;
  network_name: string;
  signature?: string;
}

export interface VerifyCryptoWalletRequest {
  wallet_id: string;
  signature: string;
  message: string;
}
