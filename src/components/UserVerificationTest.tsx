"use client";
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const UserVerificationTest = () => {
  const [testWalletAddress, setTestWalletAddress] = useState('test-wallet-address-123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUserCheck = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/users/check-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: testWalletAddress }),
      });

      const data = await response.json();
      setResult({ type: 'check', data });
    } catch (error) {
      setResult({ type: 'error', error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testUserCreation = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/users/createuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: testWalletAddress,
          username: testWalletAddress
        }),
      });

      const data = await response.json();
      setResult({ type: 'create', data });
    } catch (error) {
      setResult({ type: 'error', error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testWebSocketMessage = () => {
    setLoading(true);
    setResult(null);
    
    try {
      const websocketMessage = {
        action: "createuser",
        walletAddress: testWalletAddress,
        username: testWalletAddress
      };
      
      if (typeof window !== 'undefined' && window.WebSocket) {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_CRASH_SERVER || 'ws://localhost:8080');
        
        ws.onopen = () => {
          ws.send(JSON.stringify(websocketMessage));
          setResult({ type: 'websocket', message: 'WebSocket message sent successfully', data: websocketMessage });
          ws.close();
          setLoading(false);
        };
        
        ws.onerror = (error) => {
          setResult({ type: 'error', error: 'WebSocket connection failed: ' + error });
          setLoading(false);
        };
      } else {
        setResult({ type: 'error', error: 'WebSocket not available' });
        setLoading(false);
      }
    } catch (error) {
      setResult({ type: 'error', error: error instanceof Error ? error.message : String(error) });
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Verification Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Test Wallet Address:
          </label>
          <input
            type="text"
            value={testWalletAddress}
            onChange={(e) => setTestWalletAddress(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter wallet address to test"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testUserCheck} 
            disabled={loading}
            variant="outline"
          >
            Check User Exists
          </Button>
          
          <Button 
            onClick={testUserCreation} 
            disabled={loading}
            variant="outline"
          >
            Create User (API)
          </Button>
          
          <Button 
            onClick={testWebSocketMessage} 
            disabled={loading}
            variant="outline"
          >
            Send WebSocket Message
          </Button>
        </div>

        {loading && (
          <div className="text-center text-blue-600">
            Loading...
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">
              Result ({result.type}):
            </h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserVerificationTest;
