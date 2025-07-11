import { createWorker } from 'tesseract.js';

export const extractTextFromImage = async (file: File): Promise<string> => {
  let worker;
  try {
    // Create worker with minimal configuration
    worker = await createWorker();
    
    // Initialize worker with English language
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Convert File to base64 for Tesseract
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(file);
    });

    try {
      // Recognize text with improved configuration
      const { data: { text } } = await worker.recognize(base64Image, {
        preserve_interword_spaces: true,
        preserve_newlines: true
      });
      
      // Process the extracted text to maintain structure
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Format the text with proper structure
      let formattedText = '';
      let inList = false;
      let inCodeBlock = false;
      let listIndentation = '';
      let previousLineEmpty = false;
      
      lines.forEach((line, index) => {
        // Detect code blocks (lines starting with common programming keywords or symbols)
        const codeBlockIndicators = /^(function|const|let|var|if|for|while|class|import|export|return|{|}|\/\/|\*|#)/;
        const isCodeLine = codeBlockIndicators.test(line.trim());

        // Start code block if detected
        if (isCodeLine && !inCodeBlock) {
          if (!previousLineEmpty) formattedText += '\n';
          formattedText += '```\n';
          inCodeBlock = true;
        }

        // Handle different types of content
        if (inCodeBlock) {
          // Code block content
          formattedText += `${line}\n`;
          
          // End code block if next line is not code
          const nextLine = lines[index + 1];
          if (!nextLine || !codeBlockIndicators.test(nextLine.trim())) {
            formattedText += '```\n\n';
            inCodeBlock = false;
          }
        }
        // Detect and format headings (e.g., "1. Introduction:" or "Chapter 1:")
        else if (line.match(/^(?:\d+\.|Chapter|Section)\s+[A-Z].*[:]/i)) {
          if (inList) {
            formattedText += '\n';
            inList = false;
          }
          formattedText += `## ${line}\n\n`;
        }
        // Detect and format subheadings
        else if (line.match(/^[A-Z][^.!?]+[:]/)) {
          if (inList) {
            formattedText += '\n';
            inList = false;
          }
          formattedText += `### ${line}\n\n`;
        }
        // Detect and format bullet points
        else if (line.match(/^[•\-\*\+○●◦◆◇■□]\s/)) {
          inList = true;
          listIndentation = line.match(/^\s*/)?.[0] || '';
          formattedText += `* ${line.replace(/^[•\-\*\+○●◦◆◇■□]\s/, '')}\n`;
        }
        // Detect and format numbered lists
        else if (line.match(/^\d+[\.)]\s/)) {
          inList = true;
          listIndentation = line.match(/^\s*/)?.[0] || '';
          formattedText += `${line}\n`;
        }
        // Handle regular paragraphs
        else {
          if (inList) {
            formattedText += '\n';
            inList = false;
          }

          // Check if this line might be a continuation of the previous line
          const isContinuation = (
            index > 0 &&
            !previousLineEmpty &&
            !line.match(/^[A-Z]/) && // Doesn't start with capital letter
            !lines[index - 1].match(/[.!?]$/) // Previous line doesn't end with punctuation
          );

          if (isContinuation) {
            formattedText += ` ${line}`;
          } else {
            formattedText += `${line}\n\n`;
          }
        }

        previousLineEmpty = line.trim().length === 0;
      });

      if (!formattedText.trim()) {
        throw new Error('No text was found in the image');
      }
      
      return formattedText.trim();
    } catch (error) {
      throw new Error('Failed to process the image text');
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
    throw new Error('Failed to extract text from image. Please try again with a different image.');
  } finally {
    // Always terminate the worker
    if (worker) {
      await worker.terminate();
    }
  }
};