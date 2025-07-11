import React from 'react';

interface BannerStyle {
  gradient: string;
  textColor: string;
  pattern?: string;
}

interface BannerSize {
  name: string;
  width: string;
  height: string;
  textSize: string;
  padding: string;
}

// Architecture diagram in ASCII art
const ARCHITECTURE_DIAGRAM = `
┌──────────────────────────────────────────────────────────────────┐
│                        DocQ Architecture                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Frontend UI │    │State Manager│    │Theme Provider│         │
│  │(React/Vite) │◄──►│(React Context)◄──►│(Dark/Light) │         │
│  └─────┬───────┘    └──────┬──────┘    └─────────────┘         │
│        │                   │                                     │
│        ▼                   ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Components  │    │   Storage   │    │ API Handler │         │
│  │ ├─ Chat    │◄──►│├─ Local    │◄──►│  (REST APIs) │         │
│  │ ├─ QA      │    │├─ OpenSearch│    └─────────────┘         │
│  │ └─ UI      │    │└─ Milvus   │                             │
│  └─────┬───────┘    └─────┬─────┘                             │
│        │                  │                                     │
│        ▼                  ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Chat Modes  │    │   Search    │    │File Handlers│         │
│  │├─ Knowledge│◄──►│   Engine    │◄──►│├─ PDF       │         │
│  │├─ AI       │    │             │    │├─ Word      │         │
│  │└─ Hybrid   │    └─────────────┘    │└─ Image     │         │
│  └─────┬───────┘                      └─────────────┘         │
│        │                                                       │
│        ▼                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │AI Services  │    │  Security   │    │    Data     │         │
│  │├─ OpenAI   │◄──►│├─ PII Mask  │◄──►│  Handlers   │         │
│  │└─ Local LLM│    │└─ Sanitize  │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘`;

const BANNER_STYLES: BannerStyle[] = [
  {
    gradient: 'from-blue-600 to-indigo-600',
    textColor: 'text-white',
    pattern: 'radial-gradient(circle at 20% 110%, rgba(255, 255, 255, 0.1) 10%, transparent 20%)'
  }
];

const BANNER_SIZES: BannerSize[] = [
  {
    name: 'full',
    width: 'w-full',
    height: 'h-auto',
    textSize: 'text-xs',
    padding: 'p-6'
  }
];

interface BannerProps {
  text: string;
  showDiagram?: boolean;
}

export const Banner: React.FC<BannerProps> = ({ text, showDiagram = false }) => {
  const style = BANNER_STYLES[0]; // Use the first style for consistency

  return (
    <div className="w-full p-4">
      <div 
        className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${style.gradient} shadow-lg`}
      >
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: style.pattern,
            opacity: 0.1
          }}
        />
        <div className="relative z-10 p-6">
          <h3 className={`text-xl font-bold ${style.textColor} mb-4`}>
            {text}
          </h3>
          {showDiagram && (
            <div className="bg-black/20 rounded-lg p-4 overflow-x-auto">
              <pre className="font-mono text-white whitespace-pre text-[0.7rem] leading-tight">
                {ARCHITECTURE_DIAGRAM}
              </pre>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};