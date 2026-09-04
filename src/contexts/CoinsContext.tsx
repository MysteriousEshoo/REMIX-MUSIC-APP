/**
 * CoinsContext — Ye file coins system manage karti hai.
 *
 * KYUN zaruri hai:
 * - User ke coins balance globally track hota hai
 * - Songs play karne pe 1 coin milta hai
 * - DJs ko tip kar sakte hain
 * - Creator Dashboard mein real coins dikhte hain
 *
 * KAISE kaam karta hai:
 * 1. Login pe balance fetch hota hai
 * 2. Song play hone pe coins milte hain (24h cooldown per song)
 * 3. Tip bhejne pe sender se deducted, receiver ko added
 * 4. Transactions history track hoti hai
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { notifyTip } from '../utils/notifications';

interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'tip_received' | 'tip_sent';
  amount: number;
  description: string;
  created_at: string;
}

interface CoinsContextType {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Transaction[];
  loading: boolean;
  
  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  earnCoins: (songId: string) => Promise<number>;
  sendTip: (receiverId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  refreshAll: () => Promise<void>;
}

const CoinsContext = createContext<CoinsContextType | undefined>(undefined);

export const useCoins = () => {
  const context = useContext(CoinsContext);
  if (!context) {
    throw new Error('useCoins must be used within CoinsProvider');
  }
  return context;
};

export const CoinsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // ==================== FETCH BALANCE ====================
  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coins')
        .select('balance, total_earned, total_spent')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // No coins record yet — create one
        const { error: insertError } = await supabase
          .from('coins')
          .insert({
            user_id: user.id,
            balance: 0,
            total_earned: 0,
            total_spent: 0,
          });

        if (!insertError) {
          setBalance(0);
          setTotalEarned(0);
          setTotalSpent(0);
        }
        return;
      }

      setBalance(data.balance || 0);
      setTotalEarned(data.total_earned || 0);
      setTotalSpent(data.total_spent || 0);
    } catch (err) {
      console.log('[CoinsContext] Error fetching balance:', err);
    }
  }, [user]);

  // ==================== FETCH TRANSACTIONS ====================
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('id, type, amount, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) {
        setTransactions([]);
        return;
      }

      setTransactions(data);
    } catch (err) {
      console.log('[CoinsContext] Error fetching transactions:', err);
    }
  }, [user]);

  // ==================== EARN COINS ====================
  const earnCoins = useCallback(async (songId: string): Promise<number> => {
    if (!user) return 0;

    try {
      // Check if already earned for this song in last 24 hours
      const { data: existing } = await supabase
        .from('coin_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('reference_id', songId)
        .eq('type', 'earn')
        .eq('reference_type', 'play')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existing) {
        // Already earned for this song
        return balance;
      }

      // Insert or update coins
      const { data: currentCoins } = await supabase
        .from('coins')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single();

      const newBalance = (currentCoins?.balance || 0) + 1;

      if (currentCoins) {
        // Update existing
        await supabase
          .from('coins')
          .update({
            balance: newBalance,
            total_earned: (currentCoins.total_earned || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        // Create new
        await supabase
          .from('coins')
          .insert({
            user_id: user.id,
            balance: 1,
            total_earned: 1,
            total_spent: 0,
          });
      }

      // Record transaction
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          type: 'earn',
          amount: 1,
          description: 'Played a song',
          reference_id: songId,
          reference_type: 'play',
        });

      // Update local state
      setBalance(newBalance);
      setTotalEarned(prev => prev + 1);

      console.log('[CoinsContext] Earned 1 coin for playing song:', songId);
      return newBalance;
    } catch (err) {
      console.log('[CoinsContext] Error earning coins:', err);
      return balance;
    }
  }, [user, balance]);

  // ==================== SEND TIP ====================
  const sendTip = useCallback(async (
    receiverId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };
    if (amount <= 0) return { success: false, error: 'Invalid amount' };
    if (user.id === receiverId) return { success: false, error: 'Cannot tip yourself' };
    if (balance < amount) return { success: false, error: 'Insufficient coins' };

    try {
      // Deduct from sender
      const { error: senderError } = await supabase
        .from('coins')
        .update({
          balance: balance - amount,
          total_spent: totalSpent + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (senderError) {
        return { success: false, error: 'Failed to deduct coins' };
      }

      // Add to receiver
      const { data: receiverCoins } = await supabase
        .from('coins')
        .select('balance')
        .eq('user_id', receiverId)
        .single();

      const newReceiverBalance = (receiverCoins?.balance || 0) + amount;

      if (receiverCoins) {
        await supabase
          .from('coins')
          .update({
            balance: newReceiverBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', receiverId);
      } else {
        await supabase
          .from('coins')
          .insert({
            user_id: receiverId,
            balance: amount,
            total_earned: amount,
            total_spent: 0,
          });
      }

      // Record sender transaction
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          type: 'tip_sent',
          amount,
          description: 'Tipped a DJ',
          reference_id: receiverId,
          reference_type: 'tip',
        });

      // Record receiver transaction
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: receiverId,
          type: 'tip_received',
          amount,
          description: 'Received a tip',
          reference_id: user.id,
          reference_type: 'tip',
        });

      // Update local state
      setBalance(prev => prev - amount);
      setTotalSpent(prev => prev + amount);

      // Send notification to DJ
      await notifyTip(user.id, receiverId, amount);

      console.log('[CoinsContext] Tipped', amount, 'coins to:', receiverId);
      return { success: true };
    } catch (err) {
      console.log('[CoinsContext] Error sending tip:', err);
      return { success: false, error: 'Transaction failed' };
    }
  }, [user, balance, totalSpent]);

  // ==================== REFRESH ALL ====================
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalance(), fetchTransactions()]);
    setLoading(false);
  }, [fetchBalance, fetchTransactions]);

  // ==================== INITIALIZE ====================
  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchTransactions();
    } else {
      setBalance(0);
      setTotalEarned(0);
      setTotalSpent(0);
      setTransactions([]);
    }
  }, [user]);

  return (
    <CoinsContext.Provider
      value={{
        balance,
        totalEarned,
        totalSpent,
        transactions,
        loading,
        fetchBalance,
        fetchTransactions,
        earnCoins,
        sendTip,
        refreshAll,
      }}
    >
      {children}
    </CoinsContext.Provider>
  );
};
