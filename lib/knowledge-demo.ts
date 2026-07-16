export type DemoDocument = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
};

export type ConnectedSource = {
  id: string;
  name: string;
  description: string;
  status: "connected" | "coming-soon";
  lastSync?: string;
  documentCount?: number;
};

export const DEMO_DOCUMENTS: DemoDocument[] = [
  {
    id: "doc-1",
    name: "Product FAQ.pdf",
    type: "PDF",
    size: "1.2 MB",
    uploadedAt: "Uploaded 2 days ago",
  },
  {
    id: "doc-2",
    name: "Pricing & Packages.docx",
    type: "Word",
    size: "840 KB",
    uploadedAt: "Uploaded 5 days ago",
  },
  {
    id: "doc-3",
    name: "Customer Support Playbook.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedAt: "Uploaded 1 week ago",
  },
];

export const CONNECTED_SOURCES: ConnectedSource[] = [
  {
    id: "website",
    name: "Website",
    description: "Sync pages and content from your company website.",
    status: "connected",
    lastSync: "2 hours ago",
    documentCount: 24,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Import documents and folders from Google Drive.",
    status: "coming-soon",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Connect workspaces and knowledge bases from Notion.",
    status: "coming-soon",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    description: "Sync files and team sites from Microsoft SharePoint.",
    status: "coming-soon",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Bring in shared folders and business documents.",
    status: "coming-soon",
  },
];

export function getKnowledgeStats(options: {
  documentCount: number;
  connectedSourceCount: number;
  hasWebsite: boolean;
}) {
  return {
    documents: options.documentCount,
    sources: options.connectedSourceCount,
    lastSync: options.hasWebsite ? "2 hours ago" : "Never",
    indexStatus: options.hasWebsite ? "Indexed" : "Not indexed",
  };
}
