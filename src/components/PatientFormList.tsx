import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Initialize the data client
const client = generateClient<Schema>();

const PatientFormList = () => {
  const [patientForms, setPatientForms] = useState<Array<Schema["PatientForm"]["type"]>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<Schema["PatientForm"]["type"] | null>(null);

  useEffect(() => {
    fetchPatientForms();
    
    // Set up real-time subscription
    const subscription = client.models.PatientForm.observeQuery().subscribe({
      next: ({ items }) => {
        setPatientForms(items);
        setIsLoading(false);
      },
      error: (error) => {
        console.error('Error observing PatientForm data:', error);
        setError('Failed to load real-time updates for patient forms');
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPatientForms = async () => {
    try {
      setIsLoading(true);
      const response = await client.models.PatientForm.list();
      setPatientForms(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching patient forms:', error);
      setError('Failed to load patient forms');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const parseJSON = (jsonString: string | null | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return jsonString;
    }
  };

  const renderFormDetails = () => {
    if (!selectedForm) return null;

    return (
      <div className="patient-form-details">
        <h3>Patient Details</h3>
        <div className="details-grid">
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{selectedForm.patientName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{selectedForm.patientId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date of Birth:</span>
            <span className="detail-value">{formatDate(selectedForm.dateOfBirth || '')}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Address:</span>
            <span className="detail-value">{selectedForm.address}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{selectedForm.phoneNumber}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{selectedForm.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Insurance Provider:</span>
            <span className="detail-value">{selectedForm.insuranceProvider || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Policy Number:</span>
            <span className="detail-value">{selectedForm.policyNumber || 'N/A'}</span>
          </div>
        </div>

        {selectedForm.medicalHistory && (
          <div className="complex-section">
            <h4>Medical History</h4>
            <ul>
              {parseJSON(selectedForm.medicalHistory)?.map((item: any, index: number) => (
                <li key={index}>
                  {item.condition} (diagnosed: {item.diagnosed})
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedForm.medications && (
          <div className="complex-section">
            <h4>Medications</h4>
            <ul>
              {parseJSON(selectedForm.medications)?.map((item: any, index: number) => (
                <li key={index}>
                  {item.name} - {item.dosage} ({item.frequency})
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedForm.allergies && (
          <div className="complex-section">
            <h4>Allergies</h4>
            <ul>
              {parseJSON(selectedForm.allergies)?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {selectedForm.emergencyContact && (
          <div className="complex-section">
            <h4>Emergency Contact</h4>
            <div>
              {(() => {
                const contact = parseJSON(selectedForm.emergencyContact);
                return contact ? (
                  <>
                    <p><strong>Name:</strong> {contact.name}</p>
                    <p><strong>Relationship:</strong> {contact.relationship}</p>
                    <p><strong>Phone:</strong> {contact.phoneNumber}</p>
                  </>
                ) : 'No emergency contact provided';
              })()}
            </div>
          </div>
        )}

        <button 
          className="back-button"
          onClick={() => setSelectedForm(null)}
        >
          Back to List
        </button>
      </div>
    );
  };

  if (isLoading && patientForms.length === 0) {
    return <div className="loading">Loading patient forms...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (selectedForm) {
    return renderFormDetails();
  }

  return (
    <div className="patient-form-list">
      <h2>Patient Form Submissions</h2>
      
      {patientForms.length === 0 ? (
        <p className="no-forms">No patient forms have been submitted yet.</p>
      ) : (
        <div className="form-cards">
          {patientForms.map((form) => (
            <div 
              key={form.id} 
              className="form-card"
              onClick={() => setSelectedForm(form)}
            >
              <h3>{form.patientName}</h3>
              <p><strong>ID:</strong> {form.patientId}</p>
              <p><strong>Date of Birth:</strong> {formatDate(form.dateOfBirth || '')}</p>
              <p><strong>Email:</strong> {form.email}</p>
              <button className="view-details-button">View Details</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientFormList;