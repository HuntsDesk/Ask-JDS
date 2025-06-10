import { supabase } from './supabase';

// Legal document versions - UPDATE THESE WHEN TERMS CHANGE
export const LEGAL_DOCUMENTS = {
  terms: {
    version: "2025-01-15",
    effectiveDate: "2025-01-15",
    displayTitle: "Terms of Service (v2025.1)"
  },
  privacy: {
    version: "2025-01-15", 
    effectiveDate: "2025-01-15",
    displayTitle: "Privacy Policy (v2025.1)"
  },
  disclaimer: {
    version: "2025-01-15",
    effectiveDate: "2025-01-15", 
    displayTitle: "Educational Disclaimer (v2025.1)"
  }
} as const;

export type DocumentType = keyof typeof LEGAL_DOCUMENTS;

interface AgreementData {
  documentType: DocumentType;
  version?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record user acceptance of legal documents using RPC for authenticated users
 */
export async function recordAgreement(data: AgreementData): Promise<boolean> {
  try {
    const version = data.version || LEGAL_DOCUMENTS[data.documentType].version;
    
    const { error } = await supabase
      .from('user_agreements')
      .insert({
        document_type: data.documentType,
        version: version,
        ip_address: data.ipAddress,
        user_agent: data.userAgent || navigator.userAgent
      });

    if (error) {
      console.error('Error recording agreement:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to record agreement:', err);
    return false;
  }
}

/**
 * Record acceptance of all legal documents during signup using SECURITY DEFINER function
 * This bypasses RLS for users who haven't confirmed their email yet
 */
export async function recordSignupAgreements(userId: string): Promise<boolean> {
  try {
    // Get user's IP address for audit trail
    const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
    const ipData = ipResponse ? await ipResponse.json().catch(() => null) : null;
    const ipAddress = ipData?.ip;
    const userAgent = navigator.userAgent;

    // Prepare agreements array for batch insert
    const agreements = [
      {
        document_type: 'terms',
        version: LEGAL_DOCUMENTS.terms.version,
        ip_address: ipAddress,
        user_agent: userAgent
      },
      {
        document_type: 'privacy', 
        version: LEGAL_DOCUMENTS.privacy.version,
        ip_address: ipAddress,
        user_agent: userAgent
      },
      {
        document_type: 'disclaimer',
        version: LEGAL_DOCUMENTS.disclaimer.version,
        ip_address: ipAddress,
        user_agent: userAgent
      }
    ];

    // Call the SECURITY DEFINER function
    const { error } = await supabase.rpc('record_user_agreements', {
      _user_id: userId,
      _agreements: agreements,
      _ip_address: ipAddress,
      _user_agent: userAgent
    });

    if (error) {
      console.error('Error recording signup agreements:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to record signup agreements:', err);
    return false;
  }
}

/**
 * Check if user has accepted current version of documents
 */
export async function hasAcceptedCurrentVersion(documentType: DocumentType): Promise<boolean> {
  try {
    const currentVersion = LEGAL_DOCUMENTS[documentType].version;
    
    const { data, error } = await supabase
      .from('user_agreements')
      .select('id')
      .eq('document_type', documentType)
      .eq('version', currentVersion)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking agreement:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Failed to check agreement:', err);
    return false;
  }
} 