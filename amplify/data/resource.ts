import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // New PatientForm model for storing Mistral AI OCR form data
  PatientForm: a
    .model({
      patientName: a.string().required(),
      patientId: a.string().required(),
      dateOfBirth: a.string().required(),
      address: a.string().required(),
      phoneNumber: a.string().required(),
      email: a.string().required(),
      insuranceProvider: a.string(),  // Optional by default
      policyNumber: a.string(),       // Optional by default
      medicalHistory: a.string(),     // Optional by default
      medications: a.string(),        // Optional by default
      allergies: a.string(),          // Optional by default
      emergencyContact: a.string(),   // Optional by default
      rawOcrText: a.string(),         // Optional by default
      confidence: a.float(),          // Optional by default
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
