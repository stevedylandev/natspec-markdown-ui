import { useState, useEffect } from "react";
import { MarkdownUI } from '@markdown-ui/react';
import { Marked } from 'marked';
import { markedUiExtension } from '@markdown-ui/marked-ext';
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import { parseContractToMarkdown, type ContractResponse } from './utils/contractParser';
import './App.css';


const marked = new Marked().use(markedUiExtension);

const CONTRACT_ADDRESS = "0xEeF9B4a84C3327860CD14E1E066D7D6762b9bC3F";
const CHAIN_ID = "11155111"; // Sepolia

function App() {
  const [contractHtml, setContractHtml] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractResponse | null>(null);
  const [counterValue, setCounterValue] = useState<bigint | undefined>();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });


  const walletClient = typeof window !== 'undefined' && (window as any).ethereum 
    ? createWalletClient({
        chain: sepolia,
        transport: custom((window as any).ethereum),
      })
    : null;

  const handleWidgetEvent = async (event: { detail: { id: string, value: unknown } }) => {
    if (!contractData || !walletClient) return;

    console.log('Widget event received:', event.detail);

    try {
      const { id, value } = event.detail;

      if (id === 'setNumber') {
        const newValue = BigInt((value as any)?.newValue || (value as string) || 0);
        console.log('Setting number to:', newValue);

        const [account] = await walletClient.requestAddresses();

        const { request } = await publicClient.simulateContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: contractData.abi,
          functionName: 'setNumber',
          args: [newValue],
          account,
        });

        const hash = await walletClient.writeContract(request);
        console.log('Transaction hash:', hash);
        await readContractValue();
      } else if (id === 'increment') {
        console.log('Incrementing counter');

        const [account] = await walletClient.requestAddresses();

        const { request } = await publicClient.simulateContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: contractData.abi,
          functionName: 'increment',
          args: [],
          account,
        });

        const hash = await walletClient.writeContract(request);
        console.log('Transaction hash:', hash);
        await readContractValue();
      }
    } catch (error) {
      console.error('Contract interaction error:', error);
    }
  };

  const readContractValue = async () => {
    if (!contractData) return;

    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractData.abi,
        functionName: 'number',
        args: [],
      });
      setCounterValue(result as unknown as bigint);
    } catch (error) {
      console.error('Contract read error:', error);
    }
  };

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

  useEffect(() => {
    if (contractData) {
      readContractValue();
    }
  }, [contractData]);

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
  }, [contractHtml, contractData, walletClient]);


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
      <MarkdownUI html={contractHtml} />
    </div>
  );
}

export default App;
