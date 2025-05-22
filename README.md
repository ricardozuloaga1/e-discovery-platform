# E-Discovery Platform

A cutting-edge e-discovery platform leveraging AI to transform document analysis and extraction across multiple file formats, with intelligent processing and user-friendly interfaces.

## Features

- **Document Management**: Upload, organize, and manage document collections
- **AI-Powered Analysis**: Automatic summarization, PII detection, and entity extraction
- **Document Viewer**: Review documents with advanced redaction capabilities
- **Tagging System**: Organize documents with custom tags and categories
- **Protocol-Driven Coding**: Upload review protocols to guide AI tagging
- **Database Storage**: Persist documents and metadata in PostgreSQL
- **Production Tools**: Generate production sets with Bates stamping

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI for document analysis and insights
- **Document Processing**: Support for PDF, DOCX, and plain text formats

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
   ```
   git clone https://github.com/ricardozuloaga1/e-discovery-platform.git
   cd e-discovery-platform
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file with the following variables:
     ```
     DATABASE_URL=your_postgres_connection_string
     OPENAI_API_KEY=your_openai_api_key
     ```

4. Initialize the database schema
   ```
   npm run db:push
   ```

5. Start the development server
   ```
   npm run dev
   ```

## Usage

1. **Upload Documents**: Use the upload feature to add documents to the system
2. **Review Documents**: Open documents in the viewer to read and analyze content
3. **Apply Redactions**: Use the redaction tools to hide sensitive information
4. **Create Productions**: Generate production sets with Bates numbering

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.