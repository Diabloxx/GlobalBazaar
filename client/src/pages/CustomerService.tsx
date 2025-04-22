import { useLocation } from 'wouter';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Truck, RotateCcw, CreditCard, HelpCircle, Phone, Mail, MessageSquare } from 'lucide-react';

// FAQ data
const faqs = [
  {
    question: "How do I track my order?",
    answer: "You can track your order by logging into your account and navigating to the 'Orders' section. There you'll find all your recent orders and their current status. You can also click on any order to see detailed tracking information."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept a variety of payment methods including credit cards (Visa, Mastercard, American Express), Stripe, and Apple Pay. All payments are processed securely through our encrypted payment gateway."
  },
  {
    question: "How long does shipping take?",
    answer: "Shipping times vary depending on your location and the shipping method chosen. Standard shipping typically takes 3-7 business days within the continental US. Express shipping options (1-2 days) are available at checkout for an additional fee."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy on most items. Products must be in their original condition with tags attached and original packaging. Some items like personalized products or intimate apparel are not eligible for returns for hygiene reasons."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to most countries worldwide. International shipping times typically range from 7-21 days depending on the destination country. Additional customs fees and taxes may apply and are the responsibility of the recipient."
  },
  {
    question: "How can I cancel or modify my order?",
    answer: "If you need to cancel or modify your order, please contact our customer service team as soon as possible. Orders can usually be modified or cancelled if they haven't entered the shipping process. Once an order has shipped, you'll need to follow our return process."
  }
];

// Shipping policy content
const shippingContent = (
  <div className="space-y-4">
    <p>At TechBazaar, we aim to provide fast and reliable shipping for all orders. Our shipping policy is designed to ensure your satisfaction with every purchase.</p>
    
    <h3 className="text-lg font-medium mt-4">Shipping Methods and Timeframes</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li><strong>Standard Shipping:</strong> 3-7 business days (Free on orders over $50)</li>
      <li><strong>Express Shipping:</strong> 1-2 business days (Additional $9.99)</li>
      <li><strong>Next Day Shipping:</strong> Next business day if ordered before 12pm ET (Additional $19.99)</li>
    </ul>
    
    <h3 className="text-lg font-medium mt-4">International Shipping</h3>
    <p>We ship to most countries worldwide. International shipping times typically range from 7-21 days depending on destination and customs processing. Additional fees may apply.</p>
    
    <h3 className="text-lg font-medium mt-4">Tracking Your Order</h3>
    <p>Once your order ships, you'll receive a confirmation email with tracking information. You can also track your order anytime by logging into your account.</p>
    
    <h3 className="text-lg font-medium mt-4">Shipping Restrictions</h3>
    <p>Some items may be restricted for shipping to certain locations due to local regulations. If you have any questions about shipping to your area, please contact our customer service team.</p>
  </div>
);

// Returns policy content
const returnsContent = (
  <div className="space-y-4">
    <p>We want you to be completely satisfied with your purchase. If for any reason you're not, we offer a simple and hassle-free return process.</p>
    
    <h3 className="text-lg font-medium mt-4">Return Policy</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>All items may be returned within 30 days of delivery</li>
      <li>Products must be in original condition with tags attached</li>
      <li>Original packaging must be included when possible</li>
      <li>Return shipping is free for defective items</li>
      <li>For non-defective returns, a return shipping label costs $5.99</li>
    </ul>
    
    <h3 className="text-lg font-medium mt-4">Non-Returnable Items</h3>
    <p>The following items cannot be returned:</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>Personalized or custom-made products</li>
      <li>Intimate apparel and swimwear (for hygiene reasons)</li>
      <li>Digital products and gift cards</li>
      <li>Clearance items marked as "Final Sale"</li>
    </ul>
    
    <h3 className="text-lg font-medium mt-4">Refund Process</h3>
    <p>Once we receive your return, we'll inspect the item and process your refund within 3-5 business days. Refunds will be issued to the original payment method used for purchase.</p>
    
    <h3 className="text-lg font-medium mt-4">Exchanges</h3>
    <p>For exchanges, please return the original item and place a new order for the desired replacement. This ensures faster processing of your new item while the return is being processed.</p>
  </div>
);

// Payment methods content
const paymentContent = (
  <div className="space-y-4">
    <p>TechBazaar offers a variety of secure payment options to make your shopping experience convenient and safe.</p>
    
    <h3 className="text-lg font-medium mt-4">Accepted Payment Methods</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li><strong>Credit/Debit Cards:</strong> We accept Visa, Mastercard, American Express, and Discover</li>
      <li><strong>Stripe:</strong> Fast and secure checkout with Stripe protection</li>
      <li><strong>Apple Pay:</strong> Quick checkout for Apple device users</li>
      <li><strong>Google Pay:</strong> Convenient mobile payment option</li>
      <li><strong>Shop Pay:</strong> Save your information for faster checkout</li>
    </ul>
    
    <h3 className="text-lg font-medium mt-4">Payment Security</h3>
    <p>All transactions are protected with industry-standard SSL encryption. We never store your complete credit card information on our servers. Our payment processing complies with PCI DSS standards to ensure your data remains secure.</p>
    
    <h3 className="text-lg font-medium mt-4">Billing Information</h3>
    <p>Your billing address must match the address associated with your payment method. For fraud prevention, we may verify billing information before processing orders.</p>
    
    <h3 className="text-lg font-medium mt-4">Payment Issues</h3>
    <p>If you experience any issues with payment processing, please contact our customer service team for assistance. Common issues can often be resolved by verifying your billing information or contacting your payment provider.</p>
  </div>
);

// Contact form component
const ContactForm = () => {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <Input id="name" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" placeholder="Your email address" />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
        <Input id="subject" placeholder="What is your inquiry about?" />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <Textarea id="message" placeholder="Please describe your issue or question in detail" rows={5} />
      </div>
      
      <Button className="w-full md:w-auto">
        <Send className="mr-2 h-4 w-4" /> Send Message
      </Button>
    </form>
  );
};

const CustomerService = () => {
  const [location] = useLocation();
  const hash = location.split('#')[1] || 'contact-us';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Customer Service</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          We're here to help! Find answers to your questions or contact our support team.
        </p>
      </div>
      
      <Tabs defaultValue={hash} className="space-y-8">
        <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="contact-us">Contact Us</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="orders">Order Tracking</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Contact Us */}
        <TabsContent value="contact-us">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Get In Touch</CardTitle>
                <CardDescription>
                  Fill out the form below and our customer service team will get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary" /> Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Available 24/7</p>
                  <p className="font-medium">1-800-TECHBAZAAR</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-primary" /> Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">We respond within 24 hours</p>
                  <p className="font-medium">support@techbazaar.com</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Available 9am-9pm ET</p>
                  <Button className="mt-2 w-full">Start Chat</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* FAQs */}
        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to our most commonly asked questions. If you can't find what you're looking for, please contact us.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center">
                <HelpCircle className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="font-medium dark:text-gray-100">Still have questions?</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Our team is here to help. Contact us for personalized assistance.</p>
                </div>
                <Button variant="outline" className="ml-auto">Contact Us</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Shipping Policy */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>Shipping Policy</CardTitle>
                <CardDescription>
                  Information about our shipping methods, timeframes, and costs
                </CardDescription>
              </div>
              <Truck className="ml-auto h-10 w-10 text-primary opacity-80" />
            </CardHeader>
            <CardContent>
              {shippingContent}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Returns & Refunds */}
        <TabsContent value="returns">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>Returns & Refunds</CardTitle>
                <CardDescription>
                  Our policies for returns, exchanges, and refunds
                </CardDescription>
              </div>
              <RotateCcw className="ml-auto h-10 w-10 text-primary opacity-80" />
            </CardHeader>
            <CardContent>
              {returnsContent}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Methods */}
        <TabsContent value="payment">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Accepted payment options and security information
                </CardDescription>
              </div>
              <CreditCard className="ml-auto h-10 w-10 text-primary opacity-80" />
            </CardHeader>
            <CardContent>
              {paymentContent}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Order Tracking */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Track Your Order</CardTitle>
              <CardDescription>
                Enter your order number to check status and shipping information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex space-x-2">
                  <Input placeholder="Enter order number" className="flex-grow" />
                  <Button>Track Order</Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your order number can be found in your order confirmation email or by logging into your account.
                  </p>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-medium text-lg mb-4 dark:text-gray-100">Where's my order?</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    After placing your order, you'll receive an order confirmation email. Once your order ships, you'll receive another email with tracking information. You can also find tracking information in your account under "Orders".
                  </p>
                  
                  <h3 className="font-medium text-lg mb-4 mt-6 dark:text-gray-100">Need help with your order?</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    If you have questions about your order or need assistance, our customer service team is here to help.
                  </p>
                  <Button variant="outline">Contact Customer Service</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerService;