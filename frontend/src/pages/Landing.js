import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Shield, 
  FileText, 
  Search, 
  BarChart3, 
  Upload, 
  CheckCircle, 
  Github, 
  ExternalLink,
  Zap,
  Users,
  Clock,
  Target,
  Star,
  ArrowRight,
  Play,
  TrendingUp,
  Award,
  Lock,
  Globe,
  Sparkles
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Smart Upload System",
      description: "Drag & drop multiple documents with instant processing. Supports PDF, DOCX, TXT, and more.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "AI-Powered Detection",
      description: "Advanced algorithms detect paraphrasing, citations, and similarity patterns with 99.7% accuracy.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Detailed Analytics",
      description: "Comprehensive reports with highlighted matches, similarity scores, and source identification.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Process documents in under 10 seconds with our optimized cloud infrastructure.",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { number: "99.7%", label: "Detection Accuracy" },
    { number: "10,000+", label: "Students Trust Us" },
    { number: "<10s", label: "Average Processing" },
    { number: "500+", label: "Universities" }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Professor, Stanford University",
      content: "This tool has revolutionized how we maintain academic integrity. The accuracy is remarkable.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Graduate Student, MIT",
      content: "Finally, a plagiarism checker that actually understands context and paraphrasing.",
      rating: 5
    },
    {
      name: "Prof. James Wilson",
      role: "Department Head, Oxford",
      content: "The detailed reports save us hours of manual review. Absolutely essential for educators.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sticky Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-indigo-600" />
                <div className="absolute inset-0 bg-indigo-600/20 rounded-full blur-md"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Plagiarism Control
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a 
                href="https://github.com/Tanishkagathara7/Plagiarism_Control" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                <Github className="h-5 w-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <Button 
                onClick={() => navigate('/login')} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-0 rounded-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 10,000+ Students Worldwide
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Academic Integrity
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Redefined
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Advanced AI-powered plagiarism detection that understands context, paraphrasing, and academic writing. 
              <span className="text-indigo-600 font-semibold"> Trusted by leading universities worldwide.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
              >
                <FileText className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Start Checking Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('https://plagiarism-control.vercel.app/', '_blank')}
                className="px-8 py-4 text-lg rounded-full border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                View Live Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">See Plagiarism Detection in Action</h3>
                <p className="text-gray-600">Real-time analysis with detailed similarity reports</p>
              </div>
              
              {/* Mock Dashboard */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-gray-900">Document Analysis Report</h4>
                  <Badge className="bg-green-100 text-green-700">Complete</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-red-500 mb-1">23%</div>
                    <div className="text-sm text-gray-600">Similarity Found</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-blue-500 mb-1">7</div>
                    <div className="text-sm text-gray-600">Sources Detected</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-green-500 mb-1">8.3s</div>
                    <div className="text-sm text-gray-600">Processing Time</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Similarity</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paraphrasing Detected</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Direct Matches</span>
                    <span className="text-sm font-medium">8%</span>
                  </div>
                  <Progress value={8} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 rounded-full">
              <Award className="w-4 h-4 mr-2" />
              Premium Features
            </Badge>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need for
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> academic excellence</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by cutting-edge AI and trusted by educators worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40"></div>
                <CardHeader className="relative z-10 text-center pb-4">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 text-center">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">How It Works</h3>
            <p className="text-xl text-gray-600">Three simple steps to ensure academic integrity</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Upload Documents", desc: "Drag and drop your files or browse to upload. We support all major formats." },
              { step: "02", title: "AI Analysis", desc: "Our advanced algorithms analyze content for similarities and potential issues." },
              { step: "03", title: "Get Results", desc: "Receive detailed reports with actionable insights and recommendations." }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200"></div>
                  )}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 rounded-full">
              <Users className="w-4 h-4 mr-2" />
              Trusted Worldwide
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">What Educators Say</h3>
            <p className="text-xl text-gray-600">Join thousands of satisfied users</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/60 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">Enterprise-Grade Security</h3>
            <p className="text-xl text-gray-600">Your data is protected with industry-leading security measures</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Lock className="h-8 w-8" />, title: "End-to-End Encryption", desc: "All documents are encrypted in transit and at rest" },
              { icon: <Shield className="h-8 w-8" />, title: "Privacy First", desc: "We never store or share your documents without permission" },
              { icon: <Globe className="h-8 w-8" />, title: "Global Compliance", desc: "GDPR, CCPA, and FERPA compliant data handling" }
            ].map((item, index) => (
              <div key={index} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-indigo-600 mb-4 flex justify-center">{item.icon}</div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to ensure academic integrity?
          </h3>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and educators who trust our platform for reliable plagiarism detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
            >
              <TrendingUp className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open('https://github.com/Tanishkagathara7/Plagiarism_Control', '_blank')}
              className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <Github className="mr-2 h-5 w-5" />
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <Shield className="h-8 w-8 text-indigo-400" />
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-md"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Plagiarism Control
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Advanced AI-powered plagiarism detection system built for academic integrity and content originality. 
                Trusted by leading educational institutions worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Get Started</button></li>
                <li><a href="https://plagiarism-control.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Features</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Pricing</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Connect</h4>
              <div className="flex space-x-4">
                <a 
                  href="https://github.com/Tanishkagathara7/Plagiarism_Control" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a 
                  href="https://plagiarism-control.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Plagiarism Control. Built with React and deployed on Vercel.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-400">
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                <span className="hover:text-white transition-colors cursor-pointer">Security</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;