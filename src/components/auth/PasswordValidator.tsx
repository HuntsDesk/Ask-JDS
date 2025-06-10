import { Check, X } from 'lucide-react';

interface PasswordValidatorProps {
  password: string;
  className?: string;
  error?: string | null;
}

interface ValidationRule {
  label: string;
  regex: RegExp;
  test: (password: string) => boolean;
}

const passwordRules: ValidationRule[] = [
  {
    label: 'At least 8 characters',
    regex: /.{8,}/,
    test: (password) => password.length >= 8,
  },
  {
    label: 'At least one lowercase letter (a-z)',
    regex: /[a-z]/,
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'At least one uppercase letter (A-Z)',
    regex: /[A-Z]/,
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'At least one number (0-9)',
    regex: /[0-9]/,
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: 'At least one special character (!@#$%^&*...)',
    regex: /[!@#$%^&*()_+\-=\[\]{};\\':",.\/<>?`~]/,
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};\\':",.\/<>?`~]/.test(password),
  },
];

export function PasswordValidator({ password, className = '', error }: PasswordValidatorProps) {
  // Don't show validation until user starts typing
  if (!password) {
    return (
      <div className={`text-xs text-gray-500 space-y-1 ${className}`}>
        <p>Password must contain:</p>
        <ul className="list-disc list-inside text-xs space-y-1 ml-2">
          {passwordRules.map((rule, index) => (
            <li key={index}>{rule.label}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`text-xs space-y-2 ${className}`}>
      <p className="text-gray-600 font-medium">Password requirements:</p>
      <ul className="space-y-1">
        {error && (
          <li className="flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200">
            <X className="w-3 h-3 text-red-500 flex-shrink-0" />
            <span className="text-red-600 text-xs font-medium">
              {error}
            </span>
          </li>
        )}
        {passwordRules.map((rule, index) => {
          const isValid = rule.test(password);
          return (
            <li key={index} className="flex items-center gap-2">
              {isValid ? (
                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-3 h-3 text-red-500 flex-shrink-0" />
              )}
              <span className={`${isValid ? 'text-green-600' : 'text-red-600'} text-xs`}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
      
      {error && error.includes('easy to guess') && (
        <div className="bg-blue-50 p-2 rounded border border-blue-200 mt-2">
          <p className="text-blue-700 text-xs font-medium mb-1">💡 Password Tips:</p>
          <ul className="text-blue-600 text-xs space-y-1 list-disc list-inside">
            <li>Avoid common words, names, or patterns</li>
            <li>Try mixing unrelated words with numbers</li>
            <li>Consider using a passphrase like "Coffee47#Tree"</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper function to check if password meets all requirements
export function isPasswordValid(password: string): boolean {
  return passwordRules.every(rule => rule.test(password));
}

// Helper function to get validation summary
export function getPasswordValidationSummary(password: string) {
  const results = passwordRules.map(rule => ({
    ...rule,
    isValid: rule.test(password),
  }));
  
  const validCount = results.filter(r => r.isValid).length;
  const totalCount = results.length;
  
  return {
    results,
    validCount,
    totalCount,
    isFullyValid: validCount === totalCount,
    failedRules: results.filter(r => !r.isValid),
  };
} 