import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import MistralService from '../services/mistralService';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Initialize the data client
const client = generateClient<Schema>();

// Initialize the Mistral service
const mistralService = new MistralService();

interface FormData {
  [key: string]: any;
}

const OcrFormProcessor = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ocrData, setOcrData] = useState<FormData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { handleSubmit, control, reset, setValue } = useForm<FormData>({
    defaultValues: {}
  });

  const processFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage('');
    setOcrData(null);

    try {
      const response = await mistralService.processDocument(file);
      
      if (response.status === 200 && response.data?.formFields) {
        setOcrData(response.data.formFields);
        
        // Set values in the form
        Object.entries(response.data.formFields).forEach(([key, value]) => {
          if (typeof value !== 'object') {
            setValue(key, value);
          }
        });
      } else {
        throw new Error(response.message || 'Failed to process the document');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Convert complex object fields to JSON strings for storage
      const formDataToSave: Record<string, any> = { ...data };
      
      // Handle arrays and objects by converting them to JSON strings
      if (ocrData) {
        Object.entries(ocrData).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            formDataToSave[key] = JSON.stringify(value);
          }
        });
      }
      
      // Add raw OCR text and confidence if available
      if (mistralService.lastResponse?.data) {
        formDataToSave.rawOcrText = mistralService.lastResponse.data.rawText || '';
        formDataToSave.confidence = mistralService.lastResponse.data.confidence || 0;
      }
      
      console.log('Submitting form data:', formDataToSave);
      
      // Save to PatientForm model
      const result = await client.models.PatientForm.create(formDataToSave);
      console.log('PatientForm created:', result);
      
      // Also save a reference in the Todo list
      await client.models.Todo.create({ 
        content: `Patient Form: ${data.patientName || 'Unknown'} - ID: ${data.patientId || 'Unknown'}`
      });
      
      alert('Form submitted successfully!');
      reset();
      setOcrData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    if (!ocrData) return null;

    return Object.entries(ocrData).map(([key, value]) => {
      // Skip rendering complex objects directly
      if (typeof value === 'object' && value !== null) {
        return null;
      }

      return (
        <div key={key} className="form-field">
          <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
          <Controller
            name={key}
            control={control}
            render={({ field }) => <input {...field} id={key} />}
          />
        </div>
      );
    });
  };

  const renderComplexFields = () => {
    if (!ocrData) return null;

    return Object.entries(ocrData).map(([key, value]) => {
      // Only render arrays
      if (!Array.isArray(value)) return null;

      return (
        <div key={key} className="complex-field">
          <h3>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
          <ul>
            {value.map((item, index) => (
              <li key={index}>
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  return (
    <div className="ocr-form-processor">
      <h2>Mistral AI OCR Form Processor</h2>
      
      <div className="file-upload">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={processFile} 
          accept=".pdf,.jpg,.jpeg,.png" 
          disabled={isLoading}
        />
        <p className="help-text">Upload a document to extract form data using Mistral AI OCR</p>
      </div>

      {isLoading && <div className="loading">Processing document...</div>}
      
      {errorMessage && <div className="error">{errorMessage}</div>}
      
      {ocrData && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-fields">
            {renderFormFields()}
          </div>
          
          <div className="complex-fields">
            {renderComplexFields()}
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </form>
      )}
    </div>
  );
};

export default OcrFormProcessor;