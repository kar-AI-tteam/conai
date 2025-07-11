# Contour AI - AI-Powered Knowledge Base Chat

A modern, feature-rich chat application for managing and accessing knowledge base content with AI-powered responses.

![Contour AI Screenshot](https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1000)

## 🚀 Features

### Chat Modes
- 💬 **Knowledge Base Mode**
  - Fast, precise answers from curated knowledge base
  - Relevance scoring and match highlighting
  - Fuzzy matching for better results
  
- 🧠 **Knowledge Base + AI Mode**
  - Combines knowledge base matches with AI synthesis
  - Context-aware responses
  - Natural language understanding
  
- ✨ **AI Assistant Mode**
  - Pure AI-powered responses using OpenAI's GPT model
  - General knowledge and creative tasks
  - Natural conversation flow

### Core Features
- 📝 Rich text editing with Markdown support
- 📊 Interactive table builder
- 🔌 API configuration management
- 🔍 Advanced search with relevance scoring
- 📱 Responsive design for all devices
- 🌙 Dark/Light theme support
- 🔄 Real-time streaming responses
- 📦 Import/Export functionality

### Privacy & Security
- 🛡️ Automatic PII (Personal Identifiable Information) detection
- 🔒 Full masking for sensitive data:
  - Social Security Numbers
  - Credit card numbers
  - Driver's license numbers
  - Passport numbers
  - Bank account numbers
- 👁️ Partial masking for:
  - Email addresses (first/last characters visible)
  - Phone numbers (last 4 digits visible)
  - Address numbers
- 🔐 Regular numbers and non-sensitive data remain visible

## 🛠️ Tech Stack

### Core Technologies
- **React 18.3.1**
  - Functional components
  - React Hooks
  - Context API
  - Strict Mode

- **TypeScript 5.5.3**
  - Static typing
  - Enhanced IDE support
  - Type safety

- **Vite 5.4.2**
  - Fast HMR
  - Optimized build process
  - ESM-based dev server

- **Tailwind CSS 3.4.1**
  - Utility-first CSS
  - Custom configuration
  - Typography plugin
  - Dark mode support

### Key Libraries
- **@monaco-editor/react**: Code editor component
- **lucide-react**: Modern icon library
- **marked**: Markdown parsing and rendering
- **openai**: OpenAI API integration
- **react-pdf**: PDF file handling
- **tesseract.js**: OCR for image text extraction

## 📋 Prerequisites 

- Node.js 18+
- npm or yarn
- AWS account (for S3 deployment)

## 🚀 Deployment to AWS S3

### 1. S3 Bucket Setup

1. Create an S3 bucket:
   - Open AWS Console
   - Go to S3 service
   - Create a new bucket
   - Enable "Static website hosting"
   - Set index.html as both index and error document

2. Configure bucket policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

### 2. AWS Authentication

Ensure AWS credentials are configured using one of these methods:
- AWS CLI: `aws configure`
- Environment variables:
  ```bash
  export AWS_ACCESS_KEY_ID="your-access-key"
  export AWS_SECRET_ACCESS_KEY="your-secret-key"
  ```
- IAM role (if running on AWS infrastructure)

### 3. Deployment Configuration

1. Update deployment configuration in `scripts/deploy-s3.js`:
   ```javascript
   const config = {
     bucketName: 'your-bucket-name',
     region: 'your-bucket-region',
     buildDir: 'dist'
   };
   ```

2. Install deployment dependencies:
   ```bash
   npm install
   ```

### 4. Deploy

Run the deployment script:
```bash
npm run deploy:s3
```

The script will:
1. Build the application
2. Clean up existing files in S3
3. Upload new files with proper content types
4. Configure caching headers
5. Provide the website URL

### 5. Features
- Progress tracking during upload
- Automatic content type detection
- Smart caching strategy:
  - 1 year cache for static assets
  - No cache for HTML files
- Error handling and reporting
- Cleanup of old files

## 🏃‍♂️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📦 Project Structure

```
contour-ai/
├── src/
│   ├── components/    # React components
│   ├── context/       # React context providers
│   ├── layouts/       # Page layouts
│   ├── pages/         # Page components
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── public/            # Static assets
└── scripts/          # Deployment scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.