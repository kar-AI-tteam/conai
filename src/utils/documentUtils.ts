import mammoth from 'mammoth';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const readDocumentContent = async (
  file: File
): Promise<{ content: string; error?: string }> => {
  try {
    const reader = new FileReader();

    if (file.type === 'text/plain') {
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          const content = e.target?.result;
          if (typeof content === 'string') {
            resolve({ content: content.trim() });
          } else {
            reject(new Error('Failed to read text file'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    } else if (file.type === 'application/pdf') {
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const content = e.target?.result;
            if (!content) {
              throw new Error('Failed to read PDF file');
            }

            const pdf = await pdfjs.getDocument({ data: content }).promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              text +=
                textContent.items.map((item: any) => item.str).join(' ') + '\n';
            }

            if (!text.trim()) {
              resolve({
                content: '',
                error:
                  'No readable text found in the PDF. The document might be scanned or contain only images.',
              });
            } else {
              resolve({ content: text.trim() });
            }
          } catch (error) {
            console.error('PDF reading error:', error);
            reject(
              new Error(
                'Failed to read PDF file. Please ensure the file is not corrupted.'
              )
            );
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    } else if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result;
            if (!(arrayBuffer instanceof ArrayBuffer)) {
              throw new Error('Failed to read Word document');
            }

            const result = await mammoth.extractRawText({ arrayBuffer });

            if (!result.value.trim()) {
              resolve({
                content: '',
                error: 'No readable text found in the Word document.',
              });
            } else {
              resolve({ content: result.value.trim() });
            }
          } catch (error) {
            console.error('Word document reading error:', error);
            reject(
              new Error(
                'Failed to read Word document. Please ensure the file is not corrupted.'
              )
            );
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    } else if (file.type === 'application/json') {
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const content = e.target?.result;
            if (typeof content === 'string') {
              const parsedJson = JSON.parse(content);
              const formattedJson = JSON.stringify(parsedJson, null, 2);
              resolve({ content: formattedJson.trim() });
            } else {
              reject(new Error('Failed to read JSON file'));
            }
          } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            reject(
              new Error('Invalid JSON format. Please check the file structure.')
            );
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    } else if (file.type === 'application/xml' || file.type === 'text/xml') {
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          const content = e.target?.result;
          if (typeof content === 'string') {
            resolve({ content: content.trim() });
          } else {
            reject(new Error('Failed to read XML file'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    } else {
      throw new Error(
        'Unsupported file type. Please upload a text, PDF, Word, JSON, or XML document.'
      );
    }
  } catch (error) {
    console.error('Error reading document:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to read document',
    };
  }
};
