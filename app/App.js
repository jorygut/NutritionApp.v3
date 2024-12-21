import React from 'react';
import { AuthProvider } from './authContent';  // Import the AuthProvider
import TabLayout from './_layout';  // Import your TabLayout

export default function App() {
  return (
    <AuthProvider>
      <TabLayout />
    </AuthProvider>
  );
}
