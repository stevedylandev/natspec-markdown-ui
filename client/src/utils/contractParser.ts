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

export function parseContractToMarkdown(data: ContractResponse): string {
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
      
      if (method.details) {
        // Replace \n with actual newlines
        const processedDetails = method.details.replace(/\\n/g, '\n');
        markdownContent += `${processedDetails}\n\n`;
      }
      
      if (method.params) {
        Object.entries(method.params).forEach(([paramName, paramDesc]) => {
          markdownContent += `**${paramName}:** `;
          // Replace \n with actual newlines
          const processedParamDesc = paramDesc.replace(/\\n/g, '\n');
          markdownContent += `${processedParamDesc}\n\n`;
        });
      }
      
      markdownContent += "\n";
    });
  }
  
  return markdownContent;
}

export type { ContractResponse, DevDoc, DevDocMethod };