import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, RefreshCw, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PriceMapping {
  id: string;
  price_id: string;
  tier_name: string;
  interval_type: string;
  environment: string;
  is_active: boolean;
  created_at: string;
  display_price_cents: number | null;
  display_currency: string | null;
}

export default function AdminPriceMapping() {
  const { user } = useAuth();
  const [mappings, setMappings] = useState<PriceMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for adding new mapping
  const [newMapping, setNewMapping] = useState({
    price_id: '',
    tier_name: 'Premium',
    interval_type: 'month',
    environment: 'test',
    display_price_cents: '',
    display_currency: 'USD'
  });

  // Helper function to format price for display
  const formatPrice = (cents: number | null, currency: string | null) => {
    if (!cents || !currency) return 'Not set';
    return `${currency === 'USD' ? '$' : currency}${(cents / 100).toFixed(2)}`;
  };

  // Load price mappings
  const loadMappings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stripe_price_mappings')
        .select('*')
        .order('environment', { ascending: true })
        .order('tier_name', { ascending: true })
        .order('interval_type', { ascending: true });

      if (error) throw error;
      setMappings(data || []);
    } catch (err: any) {
      setError(`Failed to load price mappings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new mapping
  const addMapping = async () => {
    if (!newMapping.price_id.trim()) {
      setError('Price ID is required');
      return;
    }

    if (newMapping.display_price_cents && isNaN(Number(newMapping.display_price_cents))) {
      setError('Display price must be a valid number');
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('stripe_price_mappings')
        .insert([{
          price_id: newMapping.price_id.trim(),
          tier_name: newMapping.tier_name,
          interval_type: newMapping.interval_type,
          environment: newMapping.environment,
          is_active: true,
          display_price_cents: newMapping.display_price_cents ? Math.round(Number(newMapping.display_price_cents) * 100) : null,
          display_currency: newMapping.display_currency
        }]);

      if (error) throw error;

      setSuccess('Price mapping added successfully!');
      setNewMapping({ 
        price_id: '', 
        tier_name: 'Premium', 
        interval_type: 'month', 
        environment: 'test',
        display_price_cents: '',
        display_currency: 'USD'
      });
      loadMappings();
    } catch (err: any) {
      setError(`Failed to add mapping: ${err.message}`);
    }
  };

  // Toggle mapping active status
  const toggleMapping = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('stripe_price_mappings')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setSuccess(`Mapping ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadMappings();
    } catch (err: any) {
      setError(`Failed to update mapping: ${err.message}`);
    }
  };

  // Delete mapping
  const deleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price mapping?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('stripe_price_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Mapping deleted successfully!');
      loadMappings();
    } catch (err: any) {
      setError(`Failed to delete mapping: ${err.message}`);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading price mappings...</div>;
  }

  return (
    <AdminLayout title="Stripe Price ID Management">
      <div className="space-y-6">

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Add New Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Price Mapping
          </CardTitle>
          <CardDescription>
            Add a new Stripe price ID mapping with display pricing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price-id">Stripe Price ID</Label>
              <Input
                id="price-id"
                value={newMapping.price_id}
                onChange={(e) => setNewMapping({ ...newMapping, price_id: e.target.value })}
                placeholder="price_1ABC123..."
              />
            </div>
            
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select value={newMapping.tier_name} onValueChange={(value) => setNewMapping({ ...newMapping, tier_name: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interval">Interval</Label>
              <Select value={newMapping.interval_type} onValueChange={(value) => setNewMapping({ ...newMapping, interval_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select value={newMapping.environment} onValueChange={(value) => setNewMapping({ ...newMapping, environment: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="display-price">Display Price ($)</Label>
              <Input
                id="display-price"
                value={newMapping.display_price_cents}
                onChange={(e) => setNewMapping({ ...newMapping, display_price_cents: e.target.value })}
                placeholder="10.00"
                type="number"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={newMapping.display_currency} onValueChange={(value) => setNewMapping({ ...newMapping, display_currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {newMapping.display_price_cents && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Preview: {formatPrice(Math.round(Number(newMapping.display_price_cents) * 100), newMapping.display_currency)}
                </span>
              )}
            </div>
            <Button onClick={addMapping} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Price Mappings
            <Button variant="outline" size="sm" onClick={loadMappings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Active mappings are used for subscription tier determination and pricing display.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No price mappings found.</p>
          ) : (
            <div className="space-y-4">
              {mappings.map((mapping) => (
                <div key={mapping.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {mapping.price_id}
                      </code>
                      <Badge variant={mapping.is_active ? "default" : "secondary"}>
                        {mapping.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {mapping.display_price_cents && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatPrice(mapping.display_price_cents, mapping.display_currency)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span><strong>Tier:</strong> {mapping.tier_name}</span>
                      <span><strong>Interval:</strong> {mapping.interval_type}</span>
                      <span><strong>Environment:</strong> {mapping.environment}</span>
                      <span><strong>Created:</strong> {new Date(mapping.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={mapping.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleMapping(mapping.id, mapping.is_active)}
                    >
                      {mapping.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMapping(mapping.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
} 