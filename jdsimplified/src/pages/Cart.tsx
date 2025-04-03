
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';
import { getCart, removeFromCart } from '@/services/courseService';
import { CartItem } from '@/types/course';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock courses data (in a real app, you would fetch this data)
  const courses = [
    {
      id: '1',
      title: 'Constitutional Law Fundamentals',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f',
      price: 299,
      originalPrice: 399,
    },
    {
      id: '2',
      title: 'Criminal Law Essentials',
      image: 'https://images.unsplash.com/photo-1453873623425-04e3561289aa',
      price: 249,
      originalPrice: 349,
    }
  ];

  useEffect(() => {
    const fetchCart = async () => {
      try {
        // In a real app, this would be fetching from an API
        const cartData = await getCart('u1'); // Mock user ID
        setCartItems(cartData);
        
        // For demo purposes, add mock data if cart is empty
        if (cartData.length === 0) {
          setCartItems([
            {
              courseId: '1',
              price: 299,
              addedAt: new Date().toISOString()
            }
          ]);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to retrieve cart items.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCart();
  }, []);

  const handleRemoveItem = async (courseId: string) => {
    try {
      // In a real app, call API to remove item
      await removeFromCart('u1', courseId); // Mock user ID
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.courseId !== courseId));
      
      toast({
        title: 'Item removed',
        description: 'The course has been removed from your cart.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart.',
        variant: 'destructive',
      });
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to your cart before proceeding to checkout.',
        variant: 'destructive',
      });
      return;
    }
    
    navigate('/checkout');
  };

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  
  // Find course details for each cart item
  const cartItemsWithDetails = cartItems.map(item => {
    const courseDetails = courses.find(course => course.id === item.courseId);
    return {
      ...item,
      title: courseDetails?.title || 'Unknown Course',
      image: courseDetails?.image || '',
      originalPrice: courseDetails?.originalPrice,
    };
  });

  return (
    <PageLayout>
      <div className="container max-w-6xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jdblue"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Explore our courses and find the perfect one for you.</p>
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {cartItemsWithDetails.map((item) => (
                      <div key={item.courseId} className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/4">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <p className="text-gray-500 text-sm">
                            Added on {new Date(item.addedAt).toLocaleDateString()}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-baseline">
                              <span className="text-lg font-bold">${item.price}</span>
                              {item.originalPrice && (
                                <span className="text-gray-400 line-through ml-2">
                                  ${item.originalPrice}
                                </span>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveItem(item.courseId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full lg:w-1/3">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span>$0.00</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <div className="mt-4 text-center">
                    <Link to="/courses" className="text-jdblue hover:underline text-sm">
                      Continue Shopping
                    </Link>
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

export default Cart;
