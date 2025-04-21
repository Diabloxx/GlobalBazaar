import { useLocation } from 'wouter';
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
import { 
  Users, 
  Clock, 
  Briefcase, 
  Shield, 
  Heart, 
  Globe, 
  BookOpen, 
  Share2 
} from 'lucide-react';

const About = () => {
  const [location] = useLocation();
  const hash = location.split('#')[1] || 'about';
  
  // Team members
  const teamMembers = [
    {
      name: "Sarah Johnson",
      title: "Founder & CEO",
      bio: "Sarah founded ShopEase in 2018 with a vision to create a simpler shopping experience. With 15+ years in e-commerce, she's passionate about connecting consumers with quality products at affordable prices.",
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "Michael Chen",
      title: "CTO",
      bio: "Michael leads technology at ShopEase, bringing 12 years of software engineering experience. He's built our platform from the ground up with a focus on performance, security, and scalability.",
      imageUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "Jessica Rodriguez",
      title: "Head of Product",
      bio: "Jessica oversees product selection and supplier relationships. With a background in retail merchandising, she has an eye for trends and quality that ensures our catalog features only the best products.",
      imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "David Wilson",
      title: "Marketing Director",
      bio: "David brings 10+ years of digital marketing expertise to ShopEase. He's responsible for our customer acquisition strategy and building the brand that millions have come to trust.",
      imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
    }
  ];
  
  // Career openings
  const careerOpenings = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote (US)"
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "New York, NY"
    },
    {
      title: "Customer Support Specialist",
      department: "Customer Experience",
      location: "Remote (Worldwide)"
    },
    {
      title: "Operations Coordinator",
      department: "Operations",
      location: "Chicago, IL"
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">About Us</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Learn more about ShopEase, our mission, and our team</p>
      </div>
      
      <Tabs defaultValue={hash} className="space-y-8">
        <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="about">About ShopEase</TabsTrigger>
            <TabsTrigger value="careers">Careers</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="affiliate">Affiliate Program</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>
        </div>
        
        {/* About ShopEase */}
        <TabsContent value="about">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl font-bold mb-4">Our Story</h1>
              <p className="text-gray-600 text-lg">
                Founded in 2018, ShopEase was born from a simple idea: shopping should be easy, enjoyable, and accessible to everyone.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-gray-600 mb-4">
                  At ShopEase, our mission is to create a shopping platform that connects people with quality products at affordable prices, while providing an exceptional user experience from browsing to delivery.
                </p>
                <p className="text-gray-600">
                  We believe that shopping online should be more than just convenient—it should be delightful. That's why we've built a platform that puts the customer experience first, with intuitive design, transparent policies, and responsive support.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="ShopEase Team" 
                  className="w-full h-auto"
                />
              </div>
            </div>
            
            <div className="my-16">
              <h2 className="text-2xl font-bold mb-6 text-center">What Sets Us Apart</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <Globe className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Global Reach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      With customers in over 50 countries and counting, we're building a truly global marketplace that breaks down borders.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Quality Assurance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Every product on our platform undergoes rigorous quality checks before we list it, ensuring only the best makes it to our customers.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <Heart className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Customer-First</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Our policies and platform are designed with one question in mind: "What's best for our customers?" This guides everything we do.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="my-16">
              <h2 className="text-2xl font-bold mb-6 text-center">Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map((member, index) => (
                  <Card key={index}>
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={member.imageUrl} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle>{member.name}</CardTitle>
                      <CardDescription>{member.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{member.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Careers */}
        <TabsContent value="careers">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
              <p className="text-gray-600 text-lg">
                We're looking for passionate individuals to help us reimagine online shopping.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="ShopEase Office" 
                  className="w-full h-auto"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Why Work With Us</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Briefcase className="h-5 w-5 text-primary mr-2 mt-1" />
                    <div>
                      <span className="font-medium">Challenging Work</span>
                      <p className="text-gray-600">
                        Tackle complex problems in e-commerce and help shape the future of online shopping.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Users className="h-5 w-5 text-primary mr-2 mt-1" />
                    <div>
                      <span className="font-medium">Collaborative Culture</span>
                      <p className="text-gray-600">
                        Work with diverse, talented colleagues who are passionate about what they do.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-primary mr-2 mt-1" />
                    <div>
                      <span className="font-medium">Work-Life Balance</span>
                      <p className="text-gray-600">
                        Flexible schedules, generous time off, and remote-first options for many positions.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="my-16">
              <h2 className="text-2xl font-bold mb-6">Current Openings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {careerOpenings.map((job, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{job.title}</CardTitle>
                      <CardDescription>
                        {job.department} • {job.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-end">
                      <Button variant="outline">View Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg mt-8">
                <h3 className="text-xl font-bold mb-2">Don't see a position that fits?</h3>
                <p className="text-gray-600 mb-4">
                  We're always looking for talented individuals to join our team. Send us your resume and we'll keep it on file for future opportunities.
                </p>
                <Button>Send Open Application</Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Privacy Policy */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>
                Last updated: April 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                At ShopEase, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
              </p>
              
              <h3>Information We Collect</h3>
              <p>
                We collect personal information that you voluntarily provide to us when you register on our website, express interest in obtaining information about us or our products, or otherwise contact us. The personal information we collect may include:
              </p>
              <ul>
                <li>Name and contact information (email address, phone number, etc.)</li>
                <li>Billing and shipping address</li>
                <li>Payment information (stored securely through our payment processors)</li>
                <li>Account credentials</li>
                <li>Order history and preferences</li>
              </ul>
              
              <h3>How We Use Your Information</h3>
              <p>We may use your information to:</p>
              <ul>
                <li>Process and fulfill your orders</li>
                <li>Send you order confirmations and updates</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Personalize your shopping experience</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our website, products, and services</li>
                <li>Detect and prevent fraud</li>
              </ul>
              
              <h3>Cookies and Tracking Technologies</h3>
              <p>
                We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
              
              <h3>Information Sharing</h3>
              <p>We may share your personal information with:</p>
              <ul>
                <li>Service providers who help us operate our business</li>
                <li>Shipping and fulfillment partners</li>
                <li>Payment processors</li>
                <li>Law enforcement or other authorities when required by law</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>
              
              <h3>Data Security</h3>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.
              </p>
              
              <h3>Your Choices</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access, correct, or delete your personal information</li>
                <li>Opt out of marketing communications</li>
                <li>Request information about how your data is processed</li>
              </ul>
              
              <h3>Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@shopease.com.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Terms & Conditions */}
        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>
                Last updated: April 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Welcome to ShopEase. Please read these Terms & Conditions carefully before using our website. By accessing or using our website, you agree to be bound by these Terms.
              </p>
              
              <h3>Product Information</h3>
              <p>
                We strive to provide accurate product descriptions, pricing, and availability information. However, we do not warrant that product descriptions or other content on the site is accurate, complete, reliable, current, or error-free.
              </p>
              
              <h3>Pricing and Availability</h3>
              <p>
                All prices are shown in USD unless otherwise specified. We reserve the right to change prices at any time. Products are subject to availability and we reserve the right to limit quantities.
              </p>
              
              <h3>Orders and Payments</h3>
              <p>
                When you place an order, you are making an offer to purchase. We reserve the right to accept or decline your order for any reason. Payment must be received prior to shipment.
              </p>
              
              <h3>Shipping and Delivery</h3>
              <p>
                Delivery times are estimates and not guaranteed. Risk of loss and title for items purchased passes to you upon delivery of the items to the carrier.
              </p>
              
              <h3>Returns and Refunds</h3>
              <p>
                Our return policy is outlined in the Returns & Refunds section of our Customer Service pages. Some items may not be eligible for return.
              </p>
              
              <h3>Intellectual Property</h3>
              <p>
                All content on our website, including text, graphics, logos, images, and software, is the property of ShopEase or our content suppliers and is protected by copyright laws.
              </p>
              
              <h3>User Accounts</h3>
              <p>
                When you create an account, you are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
              
              <h3>Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, ShopEase shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the site or products.
              </p>
              
              <h3>Governing Law</h3>
              <p>
                These Terms shall be governed by the laws of the State of Delaware, without regard to its conflict of law provisions.
              </p>
              
              <h3>Changes to Terms</h3>
              <p>
                We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of our website following any changes constitutes your acceptance of the new Terms.
              </p>
              
              <h3>Contact Us</h3>
              <p>
                If you have any questions about these Terms, please contact us at legal@shopease.com.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Affiliate Program */}
        <TabsContent value="affiliate">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl font-bold mb-4">Affiliate Program</h1>
              <p className="text-gray-600 text-lg">
                Partner with ShopEase and earn commissions on sales you refer.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Program Benefits</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Competitive Commission Rates</span>
                      <p className="text-gray-600">
                        Earn up to 10% commission on all qualified sales.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">30-Day Cookie Duration</span>
                      <p className="text-gray-600">
                        Earn commissions on purchases made within 30 days of clicking your link.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Dedicated Support</span>
                      <p className="text-gray-600">
                        Access to affiliate managers and resources to maximize your earnings.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1554774853-719586f82d77?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Affiliate Marketing" 
                  className="w-full h-auto"
                />
              </div>
            </div>
            
            <div className="my-16">
              <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2 text-center">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-primary">1</span>
                    </div>
                    <CardTitle>Sign Up</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600">
                      Complete the application form and get approved. Approval typically takes 48 hours.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 text-center">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-primary">2</span>
                    </div>
                    <CardTitle>Promote</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600">
                      Use your unique affiliate links, banners, and other marketing materials to promote ShopEase products.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 text-center">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-primary">3</span>
                    </div>
                    <CardTitle>Earn</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600">
                      Earn commissions on every qualified sale. Payments are issued monthly via PayPal or bank transfer.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="bg-primary/5 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of affiliates who are already earning by promoting ShopEase products. Our affiliate program is perfect for bloggers, influencers, and content creators in the lifestyle, tech, and home goods niches.
              </p>
              <Button size="lg">Apply Now</Button>
            </div>
          </div>
        </TabsContent>
        
        {/* Blog */}
        <TabsContent value="blog">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl font-bold mb-4">ShopEase Blog</h1>
              <p className="text-gray-600 text-lg">
                Product guides, shopping tips, and company news
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Smart Home Devices" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="text-sm text-gray-500 mb-1">April 18, 2025</div>
                  <CardTitle>The Ultimate Smart Home Setup Guide for 2025</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3">
                    Transform your living space with the latest smart home devices. From voice-controlled lighting to AI-powered security systems, we cover everything you need to know.
                  </p>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button variant="outline">Read More</Button>
                </div>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Sustainable Shopping" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="text-sm text-gray-500 mb-1">April 10, 2025</div>
                  <CardTitle>Sustainable Shopping: Our Eco-Friendly Product Line</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3">
                    Introducing our new collection of environmentally conscious products. Learn how we're reducing our carbon footprint while helping you shop more sustainably.
                  </p>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button variant="outline">Read More</Button>
                </div>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Summer Essentials" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="text-sm text-gray-500 mb-1">April 3, 2025</div>
                  <CardTitle>10 Must-Have Summer Essentials for 2025</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3">
                    Get ready for the summer season with our carefully curated list of essentials. From innovative coolers to UV-protective clothing, we've got you covered.
                  </p>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button variant="outline">Read More</Button>
                </div>
              </Card>
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline">View All Articles</Button>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg mt-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Subscribe to Our Newsletter</h2>
              <p className="text-gray-600 text-center mb-6">
                Get the latest articles, product updates, and exclusive offers straight to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input placeholder="Your email address" className="flex-grow" />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default About;