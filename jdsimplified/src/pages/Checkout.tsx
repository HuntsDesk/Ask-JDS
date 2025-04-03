import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';
import { createOrder } from '@/services/courseService';

const paymentFormSchema = z.object({
  cardName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  cardNumber: z.string().regex(/^\d{16}$/, { message: 'Card number must be 16 digits.' }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Expiry date must be in MM/YY format.' }),
  cvv: z.string().regex(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits.' }),
  paymentMethod: z.enum(['credit_card', 'paypal'], { 
    required_error: 'Please select a payment method.' 
  }),
});

const Checkout = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Mock cart items (in a real app, this would come from the cart state/API)
  const cartItems = [
    {
      courseId: '1',
      title: 'Constitutional Law Fundamentals',
      price: 299,
    }
  ];
  
  // Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      paymentMethod: 'credit_card',
    },
  });

  const onSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    setIsProcessing(true);
    try {
      // In a real app, process payment and then create order
      const orderItems = cartItems.map(item => ({
        courseId: item.courseId,
        price: item.price,
      }));
      
      const order = await createOrder('u1', orderItems); // Mock user ID
      
      // Show success status
      setIsComplete(true);
      
      setTimeout(() => {
        toast({
          title: 'Order completed',
          description: 'Your purchase was successful. You now have access to your courses.',
        });
        navigate('/courses');
      }, 2000);
      
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: 'There was a problem processing your payment.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout>
      <div className="container max-w-6xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        {isComplete ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="bg-green-100 text-green-700 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase! You'll be redirected to your dashboard shortly.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-jdblue mx-auto"></div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2 border p-3 rounded-md">
                                  <RadioGroupItem value="credit_card" id="credit_card" />
                                  <label htmlFor="credit_card" className="flex items-center cursor-pointer">
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Credit Card
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md opacity-50">
                                  <RadioGroupItem value="paypal" id="paypal" disabled />
                                  <label htmlFor="paypal" className="cursor-not-allowed">
                                    PayPal (Coming Soon)
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-6">
                        <FormField
                          control={form.control}
                          name="cardName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name on Card</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="1234 5678 9012 3456" 
                                  maxLength={16} 
                                  {...field} 
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="expiryDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="MM/YY" 
                                    maxLength={5}
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d/]/g, '');
                                      const formatted = value
                                        .replace(/^(\d{2})(\d)/, '$1/$2')
                                        .substring(0, 5);
                                      field.onChange(formatted);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="cvv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVV</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="123" 
                                    maxLength={4}
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '');
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full lg:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.courseId} className="flex justify-between">
                        <span className="font-medium">{item.title}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-bold text-lg mb-2">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-6">
                    <p>
                      By completing your purchase, you agree to our 
                      <span className="text-jdblue mx-1">Terms of Service</span> 
                      and acknowledge our 
                      <span className="text-jdblue mx-1">Privacy Policy</span>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Checkout;
