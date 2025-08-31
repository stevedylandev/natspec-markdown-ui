import { useState, useEffect } from "react";
import { MarkdownUI } from '@markdown-ui/react';
import { Marked } from 'marked';
import { markedUiExtension } from '@markdown-ui/marked-ext';
import '@markdown-ui/react/widgets.css';

const marked = new Marked().use(markedUiExtension);

const CONTRACT_ADDRESS = "0xF7eb390231F0Db11C673390f3C25e613D7228659";
const CHAIN_ID = "11155111"; // Sepolia

interface DevDocMethod {
  details?: string;
  params?: Record<string, string>;
}

interface DevDoc {
  kind?: string;
  title?: string;
  details?: string;
  methods: Record<string, DevDocMethod>;
  stateVariables?: Record<string, { details: string }>;
  version?: number;
}

interface ContractResponse {
  devdoc: DevDoc;
  matchId?: string;
  creationMatch?: string;
  runtimeMatch?: string;
  verifiedAt?: string;
  match?: string;
  chainId?: string;
  address?: string;
}

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
        
        let markdownContent = "";
        
        // Add contract header information
        if (data.devdoc?.title) {
          markdownContent += `# ${data.devdoc.title}\n\n`;
        }
        
        if (data.devdoc?.details) {
          markdownContent += `${data.devdoc.details}\n\n`;
        }
        
        // Add contract verification info
        if (data.address && data.chainId) {
          markdownContent += `**Contract:** \`${data.address}\` on Chain ID \`${data.chainId}\`\n\n`;
        }
        
        if (data.verifiedAt) {
          markdownContent += `**Verified:** ${new Date(data.verifiedAt).toLocaleDateString()}\n\n`;
        }
        
        // Process methods
        if (data.devdoc?.methods) {
          Object.entries(data.devdoc.methods).forEach(([methodName, method]) => {
            markdownContent += `## ${methodName}\n\n`;
            
            // Add method description (without markdown widgets)
            if (method.details) {
              const detailsWithoutWidgets = method.details.replace(/```markdown-ui-widget[\s\S]*?```/g, '').trim();
              if (detailsWithoutWidgets) {
                markdownContent += `${detailsWithoutWidgets}\n\n`;
              }
              
              // Extract and format markdown widgets
              const widgetMatches = method.details.match(/```markdown-ui-widget[\s\S]*?```/g);
              if (widgetMatches) {
                widgetMatches.forEach(widget => {
                  // Extract the content between the backticks
                  const widgetContent = widget.replace(/```markdown-ui-widget\s*/, '').replace(/```$/, '').trim();
                  
                  // Try to parse as JSON to validate format
                  try {
                    JSON.parse(widgetContent);
                    // If valid JSON, format it properly
                    markdownContent += `\`\`\`markdown-ui-widget\n${widgetContent}\n\`\`\`\n\n`;
                  } catch (e) {
                    // If not valid JSON, treat as DSL or skip
                    console.warn('Invalid JSON in widget:', widgetContent);
                    markdownContent += `\`\`\`markdown-ui-widget\n${widgetContent}\n\`\`\`\n\n`;
                  }
                });
              }
            }
            
            // Add parameter documentation
            if (method.params) {
              Object.entries(method.params).forEach(([paramName, paramDesc]) => {
                markdownContent += `**${paramName}:** `;
                
                // Add param description (without markdown widgets)
                const paramWithoutWidgets = paramDesc.replace(/```markdown-ui-widget[\s\S]*?```/g, '').trim();
                if (paramWithoutWidgets) {
                  markdownContent += `${paramWithoutWidgets}\n\n`;
                }
                
                // Extract and format parameter widgets
                const paramWidgetMatches = paramDesc.match(/```markdown-ui-widget[\s\S]*?```/g);
                if (paramWidgetMatches) {
                  paramWidgetMatches.forEach(widget => {
                    const widgetContent = widget.replace(/```markdown-ui-widget\s*/, '').replace(/```$/, '').trim();
                    
                    // Try to parse as JSON to validate format
                    try {
                      JSON.parse(widgetContent);
                      // If valid JSON, format it properly
                      markdownContent += `\`\`\`markdown-ui-widget\n${widgetContent}\n\`\`\`\n\n`;
                    } catch (e) {
                      // If not valid JSON, treat as DSL or skip
                      console.warn('Invalid JSON in param widget:', widgetContent);
                      markdownContent += `\`\`\`markdown-ui-widget\n${widgetContent}\n\`\`\`\n\n`;
                    }
                  });
                }
              });
            }
            
            markdownContent += "\n";
          });
        }
        
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
