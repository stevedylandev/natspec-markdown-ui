import { useState, useEffect } from "react";
import { MarkdownUI } from '@markdown-ui/react';
import { Marked } from 'marked';
import { markedUiExtension } from '@markdown-ui/marked-ext';
import '@markdown-ui/react/widgets.css';
import { parseContractToMarkdown, type ContractResponse } from './utils/contractParser';

const marked = new Marked().use(markedUiExtension);

const CONTRACT_ADDRESS = "0xEeF9B4a84C3327860CD14E1E066D7D6762b9bC3F";
const CHAIN_ID = "11155111"; // Sepolia

function App() {
  const [contractHtml, setContractHtml] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://sourcify.dev/server/v2/contract/${CHAIN_ID}/${CONTRACT_ADDRESS}?fields=devdoc`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ContractResponse = await response.json();
        
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
      <MarkdownUI html={contractHtml} />
    </div>
  );
}

export default App;
