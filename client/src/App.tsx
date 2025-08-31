import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MarkdownUI } from '@markdown-ui/react';
import { Marked } from 'marked';
import { markedUiExtension } from '@markdown-ui/marked-ext';
import { config } from './wagmi-config';
import { parseContractToMarkdown, type ContractResponse } from './utils/contractParser';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ContractApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

const marked = new Marked().use(markedUiExtension);

const CONTRACT_ADDRESS = "0xEeF9B4a84C3327860CD14E1E066D7D6762b9bC3F" as `0x${string}`;
const CHAIN_ID = "11155111"; // Sepolia

function ContractApp() {
  const [contractHtml, setContractHtml] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractResponse | null>(null);

  // Use Wagmi hook to read the counter value
  const { data: counterValue, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractData?.abi || [],
    functionName: 'number',
    args: [],
    query: {
      enabled: !!contractData?.abi,
    },
  });

  // Use Wagmi hooks for writing to contract
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleWidgetEvent = useCallback(async (event: { detail: { id: string, value: unknown } }) => {
    if (!contractData) return;

    console.log('Widget event received:', event.detail);

    try {
      const { id, value } = event.detail;

      if (id === 'setNumber') {
        const newValue = BigInt((value as { newValue?: string })?.newValue || (value as string) || 0);
        console.log('Setting number to:', newValue);

        writeContract({
          address: CONTRACT_ADDRESS,
          abi: contractData.abi,
          functionName: 'setNumber',
          args: [newValue],
        });
      } else if (id === 'increment') {
        console.log('Incrementing counter');

        writeContract({
          address: CONTRACT_ADDRESS,
          abi: contractData.abi,
          functionName: 'increment',
          args: [],
        });
      }
    } catch (error) {
      console.error('Contract interaction error:', error);
    }
  }, [contractData, writeContract]);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://sourcify.dev/server/v2/contract/${CHAIN_ID}/${CONTRACT_ADDRESS}?fields=devdoc,abi`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ContractResponse = await response.json();
        setContractData(data);

        const markdownContent = parseContractToMarkdown(data);

        console.log(markdownContent);
        const html = await marked.parse(markdownContent || '# No markdown widgets found');
        setContractHtml(html);
      } catch (err) {
        console.error('Error fetching contract data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, []);

  // Refetch counter value when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchCounter();
    }
  }, [isConfirmed, refetchCounter]);

  useEffect(() => {
    if (!contractHtml) return;

    // Set up click handlers for widget buttons
    const timer = setTimeout(() => {
      const buttons = document.querySelectorAll('button');
      
      buttons.forEach(button => {
        const container = button.closest('.widget-container');
        if (container) {
          const widget = container.querySelector('markdown-ui-widget');
          const widgetId = widget?.getAttribute('id');
          
          if (widgetId === 'increment' || widgetId === 'setNumber') {
            button.addEventListener('click', async (e) => {
              e.preventDefault();
              
              if (widgetId === 'increment') {
                await handleWidgetEvent({ detail: { id: 'increment', value: null } });
              } else if (widgetId === 'setNumber') {
                const input = container.querySelector('input') as HTMLInputElement;
                const value = input ? input.value : '42';
                await handleWidgetEvent({ detail: { id: 'setNumber', value: { newValue: value } } });
              }
            });
          }
        }
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [contractHtml, contractData, handleWidgetEvent]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
        <p>Loading contract data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
      {counterValue !== undefined && (
        <div className="text-center mb-4">
          <p className="text-lg font-semibold">Current Counter: {counterValue.toString()}</p>
        </div>
      )}
      {isPending && (
        <div className="text-center mb-4">
          <p className="text-blue-500">Transaction pending...</p>
        </div>
      )}
      {isConfirming && (
        <div className="text-center mb-4">
          <p className="text-yellow-500">Waiting for confirmation...</p>
        </div>
      )}
      {isConfirmed && hash && (
        <div className="text-center mb-4">
          <p className="text-green-500">Transaction confirmed!</p>
          <p className="text-sm text-gray-600 break-all">
            Hash: <a 
              href={`https://sepolia.etherscan.io/tx/${hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              {hash}
            </a>
          </p>
        </div>
      )}
      <MarkdownUI html={contractHtml} />
    </div>
  );
}