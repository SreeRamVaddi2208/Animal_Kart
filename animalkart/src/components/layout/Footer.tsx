'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">AK</span>
              </div>
              <span className="font-bold text-xl text-white">
                Animal<span className="text-green-400">Kart</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              India&apos;s premier livestock investment platform. Invest in premium buffalo and calf units across Andhra Pradesh.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://wa.me/919876543210" className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors">
                <MessageCircle className="w-4 h-4 text-white" />
              </a>
              <a href="mailto:support@animalkart.com" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-white" />
              </a>
              <a href="tel:+919876543210" className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors">
                <Phone className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#how-it-works" className="hover:text-green-400 transition-colors">How it Works</Link></li>
              <li><Link href="/#warehouses" className="hover:text-green-400 transition-colors">Warehouses</Link></li>
              <li><Link href="/#rewards" className="hover:text-green-400 transition-colors">Rewards</Link></li>
              <li><Link href="/auth/register" className="hover:text-green-400 transition-colors">Register</Link></li>
              <li><Link href="/auth/login" className="hover:text-green-400 transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Warehouses */}
          <div>
            <h3 className="font-semibold text-white mb-4">Our Farms</h3>
            <ul className="space-y-2 text-sm">
              {['Kurnool', 'Vijayawada', 'Guntur', 'Kakinada'].map(city => (
                <li key={city} className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span>{city}, Andhra Pradesh</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span>AnimalKart Pvt. Ltd., Hyderabad, Telangana 500001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-green-400 transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="mailto:support@animalkart.com" className="hover:text-green-400 transition-colors">support@animalkart.com</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="https://wa.me/919876543210" className="hover:text-green-400 transition-colors">WhatsApp Support</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 AnimalKart Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms & Conditions</Link>
            <Link href="/refund" className="hover:text-gray-300 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
