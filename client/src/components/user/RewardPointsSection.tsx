import React, { useState, useEffect } from 'react';
import { isAutheticated } from '../../auth/helper';
import { 
  getRewardBalance, 
  getRewardHistory, 
  formatTransactionType, 
  getTransactionBadgeColor 
} from '../../core/helper/rewardHelper';

const RewardPointsSection: React.FC = () => {
  const authData = isAutheticated();
  
  if (!authData) {
    return <div>Please login to view reward points</div>;
  }
  
  const { user, token } = authData;
  const [balance, setBalance] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRewardData();
  }, [currentPage]);

  const loadRewardData = async () => {
    try {
      setLoading(true);
      
      // Get balance
      const balanceData = await getRewardBalance(user._id, token);
      if (balanceData.error) {
        setError(balanceData.error);
        setIsEnabled(false);
        return;
      }
      
      setBalance(balanceData.balance || 0);
      setIsEnabled(balanceData.isEnabled);
      
      // Get history
      const historyData = await getRewardHistory(user._id, token, currentPage);
      if (!historyData.error) {
        setTransactions(historyData.transactions || []);
        setTotalPages(historyData.totalPages || 1);
      }
    } catch (err) {
      setError('Failed to load reward data');
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled && !loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600">Reward points system is currently disabled</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Your Reward Points</h3>
            <p className="text-4xl font-bold">{balance}</p>
            <p className="text-sm opacity-90 mt-1">≈ ₹{(balance * 0.5).toFixed(2)} value</p>
          </div>
          <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How Reward Points Work</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Earn 1% of your order value as reward points</li>
          <li>• 1 point = ₹0.50 value</li>
          <li>• Redeem up to 50 points per order</li>
          <li>• Points are credited after successful order delivery</li>
        </ul>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">No transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Start shopping to earn reward points!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {transaction.amount > 0 ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        )}
                        <span className={`text-sm px-2 py-1 rounded-full ${getTransactionBadgeColor(transaction.type)}`}>
                          {formatTransactionType(transaction.type)}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-sm text-gray-500">Balance: {transaction.balance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RewardPointsSection;
